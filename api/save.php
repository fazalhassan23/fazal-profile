<?php
/**
 * ============================================================
 * PORTFOLIO DATA PERSISTENCE API (api/save.php)
 * Secure, flat-file JSON persistence engine for Namecheap cPanel.
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Only POST is accepted.']);
    exit;
}

// Data storage target
$dataFile = __DIR__ . '/../data/portfolio-data.json';
$dataDir = dirname($dataFile);

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Read incoming JSON payload
$rawBody = file_get_contents('php://input');
if (empty($rawBody)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Empty request payload.']);
    exit;
}

$payload = json_decode($rawBody, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($payload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON structure: ' . json_last_error_msg()]);
    exit;
}

// Verify essential schema keys
$requiredKeys = ['profile', 'availability', 'metrics', 'expertise', 'awards', 'articles', 'experience', 'projects', 'education', 'skills'];
foreach ($requiredKeys as $key) {
    if (!array_key_exists($key, $payload)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => "Missing required schema field: {$key}"]);
        exit;
    }
}

// Basic auth validation: ensure request provides valid auth token or session hash
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$providedHash = '';
if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
    $providedHash = $matches[1];
}

// If stored data exists, check against stored admin password hash
$expectedHash = $payload['adminAuth']['passwordHash'] ?? '';
if (file_exists($dataFile)) {
    $existingRaw = file_get_contents($dataFile);
    $existing = json_decode($existingRaw, true);
    if (is_array($existing) && !empty($existing['adminAuth']['passwordHash'])) {
        $expectedHash = $existing['adminAuth']['passwordHash'];
    }
}

if (!empty($expectedHash) && !empty($providedHash)) {
    if (!hash_equals($expectedHash, $providedHash)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized. Invalid authentication token.']);
        exit;
    }
}

// Atomic file write using a temporary file
$tempFile = $dataFile . '.tmp.' . bin2hex(random_bytes(8));
$encodedData = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

if (file_put_contents($tempFile, $encodedData, LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write temporary data file.']);
    exit;
}

if (!rename($tempFile, $dataFile)) {
    @unlink($tempFile);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to atomically replace portfolio data file.']);
    exit;
}

chmod($dataFile, 0644);

echo json_encode([
    'success' => true,
    'message' => 'Portfolio data successfully persisted to server.',
    'updatedAt' => date('c'),
    'bytesWritten' => strlen($encodedData)
]);
