<?php
// FILE: uniwiz-backend/api/test_db.php
// Test database connection and check if site_settings table exists

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json');

require_once '../classes/core/Database.php';

try {
    $db = Database::getInstance();
    
    // Test connection
    $result = ['status' => 'connected'];
    
    // Check if site_settings table exists
    $sql = "SHOW TABLES LIKE 'site_settings'";
    $tableExists = $db->selectOne($sql);
    
    if ($tableExists) {
        $result['site_settings_table'] = 'exists';
        
        // Get count of records
        $count = $db->selectOne("SELECT COUNT(*) as count FROM site_settings");
        $result['site_settings_count'] = $count['count'];
        
        // Get footer_links if exists
        $footerSettings = $db->selectOne("SELECT setting_value FROM site_settings WHERE setting_key = 'footer_links'");
        $result['footer_links_exists'] = $footerSettings ? 'yes' : 'no';
    } else {
        $result['site_settings_table'] = 'missing';
    }
    
    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>