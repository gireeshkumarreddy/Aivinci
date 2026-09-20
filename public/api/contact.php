<?php
/**
 * Aivinci Creative Studio — contact form endpoint.
 *
 * Receives the "Start the Conversation" form (POST, multipart or JSON) and e-mails the enquiry
 * to the studio. Runs on any PHP host (Hostinger shared hosting included) with no dependencies.
 *
 * Protection: honeypot field, minimum fill time, size caps, header-injection stripping and a
 * light per-IP rate limit. Responds with JSON; the page falls back to a mailto: link if this
 * endpoint is unavailable.
 */

declare(strict_types=1);

const TO_EMAIL = 'studio@aivinci.ai';
const FROM_NAME = 'Aivinci Creative Studio website';
const SUBJECT_PREFIX = 'New project enquiry';
const MIN_FILL_SECONDS = 3;
const RATE_LIMIT_PER_HOUR = 8;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method']);
}

// ---- input (multipart/form-data, x-www-form-urlencoded or JSON) ----
$input = $_POST;
if (!$input) {
    $raw = file_get_contents('php://input') ?: '';
    $json = json_decode($raw, true);
    if (is_array($json)) {
        $input = $json;
    }
}

$field = static function (string $key, int $max) use ($input): string {
    $v = $input[$key] ?? '';
    if (is_array($v)) {
        $v = implode(', ', array_map('strval', $v));
    }
    $v = trim((string) $v);
    // never let a value smuggle extra mail headers
    $v = str_replace(["\r", "\0"], '', $v);
    if (function_exists('mb_substr')) {
        if (mb_strlen($v) > $max) {
            $v = mb_substr($v, 0, $max);
        }
    } elseif (strlen($v) > $max) {
        $v = substr($v, 0, $max);
    }
    return $v;
};

// ---- spam guards ----
if ($field('website', 200) !== '') {          // honeypot: humans never see this field
    respond(200, ['ok' => true]);              // pretend success, drop silently
}
$ts = (int) ($input['ts'] ?? 0);
if ($ts > 0 && (time() * 1000 - $ts) < MIN_FILL_SECONDS * 1000) {
    respond(429, ['ok' => false, 'error' => 'too-fast']);
}
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucket = sys_get_temp_dir() . '/aivinci-contact-' . md5($ip) . '.json';
$hits = [];
if (is_file($bucket)) {
    $hits = json_decode((string) file_get_contents($bucket), true) ?: [];
    $hits = array_values(array_filter($hits, static fn ($t) => is_int($t) && $t > time() - 3600));
}
if (count($hits) >= RATE_LIMIT_PER_HOUR) {
    respond(429, ['ok' => false, 'error' => 'rate']);
}

// ---- fields ----
$name = $field('name', 120);
$company = $field('company', 160);
$email = $field('email', 200);
$phone = $field('phone', 60);
$budget = $field('budget', 60);
$needs = $field('needs', 400);
$message = $field('message', 4000);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'invalid']);
}

// ---- the e-mail ----
$host = preg_replace('/^www\./', '', (string) ($_SERVER['HTTP_HOST'] ?? 'aivinci.ai'));
$host = preg_replace('/[^a-z0-9.-]/i', '', $host) ?: 'aivinci.ai';
$subject = SUBJECT_PREFIX . ' — ' . $name;
$lines = [
    'A visitor started the conversation on ' . $host . '.',
    '',
    'Name:      ' . $name,
    'Company:   ' . ($company !== '' ? $company : '—'),
    'Email:     ' . $email,
    'Phone:     ' . ($phone !== '' ? $phone : '—'),
    'Budget:    ' . ($budget !== '' ? $budget : '—'),
    'Needs:     ' . ($needs !== '' ? $needs : '—'),
    '',
    'Message:',
    $message,
    '',
    '—',
    'Sent ' . gmdate('Y-m-d H:i') . ' UTC · IP ' . $ip,
];
$body = implode("\n", $lines);

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$encodedFromName = '=?UTF-8?B?' . base64_encode(FROM_NAME) . '?=';
$headers = [
    // sent from the studio's own mailbox on this domain (best deliverability on shared hosting)
    'From: ' . $encodedFromName . ' <' . TO_EMAIL . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: aivinci-website',
];

$sent = @mail(TO_EMAIL, $encodedSubject, $body, implode("\r\n", $headers), '-f' . TO_EMAIL);
if (!$sent) {
    // some hosts reject the envelope-sender flag; try once without it
    $sent = @mail(TO_EMAIL, $encodedSubject, $body, implode("\r\n", $headers));
}

if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'mail']);
}

$hits[] = time();
@file_put_contents($bucket, json_encode($hits));
respond(200, ['ok' => true]);
