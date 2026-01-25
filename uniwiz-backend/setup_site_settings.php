<?php
// FILE: uniwiz-backend/setup_site_settings.php
// Setup script to create site_settings table and insert default data

require_once 'classes/core/Database.php';

try {
    $db = Database::getInstance();
    
    echo "Creating site_settings table...\n";
    
    // Create site_settings table
    $createTableSql = "
        CREATE TABLE IF NOT EXISTS site_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(255) NOT NULL UNIQUE,
            setting_value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ";
    
    $db->getConnection()->exec($createTableSql);
    echo "Site settings table created successfully.\n";
    
    // Insert default footer links
    $defaultFooterLinks = json_encode([
        "about" => "About Us",
        "contact" => "Contact",
        "privacy" => "Privacy Policy",
        "terms" => "Terms of Service",
        "careers" => "Careers"
    ]);
    
    // Check if footer_links already exists
    $existing = $db->selectOne("SELECT id FROM site_settings WHERE setting_key = 'footer_links'");
    
    if (!$existing) {
        $db->insert('site_settings', [
            'setting_key' => 'footer_links',
            'setting_value' => $defaultFooterLinks
        ]);
        echo "Default footer links inserted successfully.\n";
    } else {
        echo "Footer links already exist.\n";
    }
    
    // Verify the data
    $footerData = $db->selectOne("SELECT setting_value FROM site_settings WHERE setting_key = 'footer_links'");
    echo "Current footer links: " . $footerData['setting_value'] . "\n";
    
    echo "Setup completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>