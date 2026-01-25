<?php
// FILE: uniwiz-backend/api/update_profile.php
// =======================================================================================
// This endpoint handles updating a user's profile, including file uploads and image deletions.

header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow requests from frontend
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow these HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json'); // Respond with JSON

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

include_once '../config/database.php'; // Include database connection
$database = new Database();
$db = $database->getConnection();

// Check if database connection is successful
if ($db === null) {
    http_response_code(503); 
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

if (!isset($_POST['user_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "User ID is required."]);
    exit();
}

$user_id = $_POST['user_id'];
$profile_image_url_to_update = null;
$cv_url_to_update = null;
$cover_image_url_to_update = null;
$required_doc_url_to_update = null;

try {
    $db->beginTransaction();

    // --- 1. Get User Role ---
    $stmt_role = $db->prepare("SELECT role FROM users WHERE id = :user_id LIMIT 1");
    $stmt_role->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_role->execute();
    $user_role_row = $stmt_role->fetch(PDO::FETCH_ASSOC);
    if (!$user_role_row) {
        throw new Exception("User not found.");
    }
    $user_role = $user_role_row['role'];

    // --- 2. Handle Image Deletion (for publishers) ---
    if ($user_role === 'publisher') {
        // Handle Cover Image Deletion
        if (isset($_POST['remove_cover_image']) && $_POST['remove_cover_image'] == 'true') {
            $stmt_get_cover = $db->prepare("SELECT cover_image_url FROM publisher_profiles WHERE user_id = :user_id");
            $stmt_get_cover->execute([':user_id' => $user_id]);
            $current_cover = $stmt_get_cover->fetch(PDO::FETCH_ASSOC);
            if ($current_cover && !empty($current_cover['cover_image_url']) && file_exists($current_cover['cover_image_url'])) {
                unlink($current_cover['cover_image_url']);
            }
            $stmt_remove_cover = $db->prepare("UPDATE publisher_profiles SET cover_image_url = NULL WHERE user_id = :user_id");
            $stmt_remove_cover->execute([':user_id' => $user_id]);
        }
        // Handle Gallery Image Deletion
        if (isset($_POST['remove_gallery_images'])) {
            $images_to_delete_ids = json_decode($_POST['remove_gallery_images']);
            if (is_array($images_to_delete_ids) && !empty($images_to_delete_ids)) {
                $placeholders = implode(',', array_fill(0, count($images_to_delete_ids), '?'));
                $stmt_get_gallery = $db->prepare("SELECT image_url FROM publisher_images WHERE id IN ($placeholders) AND publisher_id = ?");
                $params = array_merge($images_to_delete_ids, [$user_id]);
                $stmt_get_gallery->execute($params);
                $images_to_unlink = $stmt_get_gallery->fetchAll(PDO::FETCH_COLUMN, 0);
                foreach ($images_to_unlink as $image_url) {
                    if (file_exists($image_url)) {
                        unlink($image_url);
                    }
                }
                $stmt_delete_gallery = $db->prepare("DELETE FROM publisher_images WHERE id IN ($placeholders) AND publisher_id = ?");
                $stmt_delete_gallery->execute($params);
            }
        }
    }

    // --- 3. Handle File Uploads (profile picture, CV, cover image, required doc, gallery images) ---
    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] == 0) {
        $file = $_FILES['profile_picture'];
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowed_types) || $file['size'] > 2097152) { throw new Exception("Invalid profile picture. Must be JPG, PNG, or GIF and under 2MB."); }
        $target_dir = "uploads/";
        if (!is_dir($target_dir)) { mkdir($target_dir, 0777, true); }
        $new_filename = "user_" . $user_id . "_" . time() . "." . pathinfo($file['name'], PATHINFO_EXTENSION);
        if (move_uploaded_file($file['tmp_name'], $target_dir . $new_filename)) { $profile_image_url_to_update = $target_dir . $new_filename; } 
        else { throw new Exception("Failed to move uploaded profile picture."); }
    }

    if ($user_role === 'student' && isset($_FILES['cv_file']) && $_FILES['cv_file']['error'] == 0) {
        $file = $_FILES['cv_file'];
        if ($file['type'] !== 'application/pdf' || $file['size'] > 5242880) { throw new Exception("Invalid CV file. Must be a PDF and under 5MB."); }
        $target_dir = "uploads/cvs/";
        if (!is_dir($target_dir)) { mkdir($target_dir, 0777, true); }
        $new_filename = "cv_user_" . $user_id . "_" . time() . "." . pathinfo($file['name'], PATHINFO_EXTENSION);
        if (move_uploaded_file($file['tmp_name'], $target_dir . $new_filename)) { $cv_url_to_update = $target_dir . $new_filename; } 
        else { throw new Exception("Failed to move uploaded CV."); }
    }
    
    if ($user_role === 'publisher' && isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] == 0) {
        $file = $_FILES['cover_image'];
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowed_types) || $file['size'] > 4194304) { throw new Exception("Invalid cover image. Must be JPG, PNG, or GIF and under 4MB."); }
        $target_dir = "uploads/covers/";
        if (!is_dir($target_dir)) { mkdir($target_dir, 0777, true); }
        $new_filename = "cover_" . $user_id . "_" . time() . "." . pathinfo($file['name'], PATHINFO_EXTENSION);
        if (move_uploaded_file($file['tmp_name'], $target_dir . $new_filename)) { $cover_image_url_to_update = $target_dir . $new_filename; } 
        else { throw new Exception("Failed to move uploaded cover image."); }
    }

    if ($user_role === 'publisher' && isset($_FILES['required_doc']) && $_FILES['required_doc']['error'] == 0) {
        $file = $_FILES['required_doc'];
        $allowed_types = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!in_array($file['type'], $allowed_types) || $file['size'] > 5242880) { throw new Exception("Invalid document. Must be PDF/JPG/PNG and under 5MB."); }
        $target_dir = "uploads/required_docs/";
        if (!is_dir($target_dir)) { mkdir($target_dir, 0777, true); }
        $new_filename = "doc_publisher_" . $user_id . "_" . time() . "." . pathinfo($file['name'], PATHINFO_EXTENSION);
        if (move_uploaded_file($file['tmp_name'], $target_dir . $new_filename)) { $required_doc_url_to_update = $target_dir . $new_filename; }
        else { throw new Exception("Failed to move uploaded required document."); }
    }

    if ($user_role === 'publisher' && isset($_FILES['company_images'])) {
        $gallery_files = $_FILES['company_images'];
        $target_dir = "uploads/gallery/";
        if (!is_dir($target_dir)) { mkdir($target_dir, 0777, true); }
        foreach ($gallery_files['name'] as $key => $name) {
            if ($gallery_files['error'][$key] === 0) {
                $file_tmp = $gallery_files['tmp_name'][$key];
                $new_gallery_filename = "gallery_" . $user_id . "_" . time() . "_" . uniqid() . "." . pathinfo($name, PATHINFO_EXTENSION);
                if (move_uploaded_file($file_tmp, $target_dir . $new_gallery_filename)) {
                    $stmt_gallery = $db->prepare("INSERT INTO publisher_images (publisher_id, image_url) VALUES (:publisher_id, :image_url)");
                    $stmt_gallery->execute([':publisher_id' => $user_id, ':image_url' => $target_dir . $new_gallery_filename]);
                }
            }
        }
    }

    // --- 4. Update Database Tables (users, student_profiles, publisher_profiles) ---
    $query_users = "UPDATE users SET first_name = :first_name, last_name = :last_name";
    $params_users = [
        ':user_id' => $user_id,
        ':first_name' => htmlspecialchars(strip_tags($_POST['first_name'])),
        ':last_name' => htmlspecialchars(strip_tags($_POST['last_name'])),
    ];
    if (isset($_POST['company_name'])) { $query_users .= ", company_name = :company_name"; $params_users[':company_name'] = htmlspecialchars(strip_tags($_POST['company_name'])); }
    if ($profile_image_url_to_update !== null) { $query_users .= ", profile_image_url = :profile_image_url"; $params_users[':profile_image_url'] = $profile_image_url_to_update; }
    $query_users .= " WHERE id = :user_id";
    $stmt_users = $db->prepare($query_users);
    $stmt_users->execute($params_users);

    // --- 5. Update Student or Publisher Profile Tables ---
    if ($user_role === 'student') {
        $stmt_check = $db->prepare("SELECT id FROM student_profiles WHERE user_id = :user_id LIMIT 1");
        $stmt_check->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_check->execute();
        $profile_exists = $stmt_check->rowCount() > 0;

        $params_student = [
            ':user_id' => $user_id,
            ':university_name' => isset($_POST['university_name']) ? htmlspecialchars(strip_tags($_POST['university_name'])) : null,
            ':field_of_study' => isset($_POST['field_of_study']) ? htmlspecialchars(strip_tags($_POST['field_of_study'])) : null,
            ':year_of_study' => isset($_POST['year_of_study']) ? htmlspecialchars(strip_tags($_POST['year_of_study'])) : null,
            ':languages_spoken' => isset($_POST['languages_spoken']) ? htmlspecialchars(strip_tags($_POST['languages_spoken'])) : null,
            ':preferred_categories' => isset($_POST['preferred_categories']) ? htmlspecialchars(strip_tags($_POST['preferred_categories'])) : null,
            ':skills' => isset($_POST['skills']) ? htmlspecialchars(strip_tags($_POST['skills'])) : null,
        ];
        if ($cv_url_to_update !== null) {
            $params_student[':cv_url'] = $cv_url_to_update;
        }

        if ($profile_exists) {
            $query_student = "UPDATE student_profiles SET university_name = :university_name, field_of_study = :field_of_study, year_of_study = :year_of_study, languages_spoken = :languages_spoken, preferred_categories = :preferred_categories, skills = :skills";
            if ($cv_url_to_update !== null) {
                $query_student .= ", cv_url = :cv_url";
            }
            $query_student .= " WHERE user_id = :user_id";
        } else {
            $cols = "user_id, university_name, field_of_study, year_of_study, languages_spoken, preferred_categories, skills";
            $vals = ":user_id, :university_name, :field_of_study, :year_of_study, :languages_spoken, :preferred_categories, :skills";
            if ($cv_url_to_update !== null) {
                $cols .= ", cv_url";
                $vals .= ", :cv_url";
            }
            $query_student = "INSERT INTO student_profiles ($cols) VALUES ($vals)";
        }
        $stmt_student = $db->prepare($query_student);
        $stmt_student->execute($params_student);
    }

    if ($user_role === 'publisher') {
        $stmt_check = $db->prepare("SELECT id FROM publisher_profiles WHERE user_id = :user_id LIMIT 1");
        $stmt_check->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_check->execute();
        $profile_exists = $stmt_check->rowCount() > 0;

        $params_publisher = [ ':user_id' => $user_id, ':about' => isset($_POST['about']) ? htmlspecialchars(strip_tags($_POST['about'])) : null, ':industry' => isset($_POST['industry']) ? htmlspecialchars(strip_tags($_POST['industry'])) : null, ':website_url' => isset($_POST['website_url']) ? htmlspecialchars(strip_tags($_POST['website_url'])) : null, ':address' => isset($_POST['address']) ? htmlspecialchars(strip_tags($_POST['address'])) : null, ':phone_number' => isset($_POST['phone_number']) ? htmlspecialchars(strip_tags($_POST['phone_number'])) : null, ':facebook_url' => isset($_POST['facebook_url']) ? htmlspecialchars(strip_tags($_POST['facebook_url'])) : null, ':linkedin_url' => isset($_POST['linkedin_url']) ? htmlspecialchars(strip_tags($_POST['linkedin_url'])) : null, ':instagram_url' => isset($_POST['instagram_url']) ? htmlspecialchars(strip_tags($_POST['instagram_url'])) : null, ];

        if ($profile_exists) {
            $query_publisher = "UPDATE publisher_profiles SET about = :about, industry = :industry, website_url = :website_url, address = :address, phone_number = :phone_number, facebook_url = :facebook_url, linkedin_url = :linkedin_url, instagram_url = :instagram_url";
            if ($cover_image_url_to_update !== null) {
                $query_publisher .= ", cover_image_url = :cover_image_url";
                $params_publisher[':cover_image_url'] = $cover_image_url_to_update;
            }
            if (isset($required_doc_url_to_update)) {
                $query_publisher .= ", required_doc_url = :required_doc_url";
                $params_publisher[':required_doc_url'] = $required_doc_url_to_update;
            }
            $query_publisher .= " WHERE user_id = :user_id";
        } else {
            $cols = "user_id, about, industry, website_url, address, phone_number, facebook_url, linkedin_url, instagram_url";
            $vals = ":user_id, :about, :industry, :website_url, :address, :phone_number, :facebook_url, :linkedin_url, :instagram_url";
             if ($cover_image_url_to_update !== null) {
                $cols .= ", cover_image_url";
                $vals .= ", :cover_image_url";
                $params_publisher[':cover_image_url'] = $cover_image_url_to_update;
            }
            if (isset($required_doc_url_to_update)) {
                $cols .= ", required_doc_url";
                $vals .= ", :required_doc_url";
                $params_publisher[':required_doc_url'] = $required_doc_url_to_update;
            }
            $query_publisher = "INSERT INTO publisher_profiles ($cols) VALUES ($vals)";
        }
        $stmt_publisher = $db->prepare($query_publisher);
        $stmt_publisher->execute($params_publisher);
    }
    
    $db->commit();

    // --- 6. Fetch and Return Fully Updated User Data ---
    $query_fetch = "
        SELECT 
            u.id, u.email, u.first_name, u.last_name, u.role, u.company_name, u.profile_image_url,
            u.is_verified, u.status,
            sp.university_name, sp.field_of_study, sp.year_of_study, sp.languages_spoken, sp.preferred_categories, sp.skills, sp.cv_url,
            pp.about, pp.industry, pp.website_url, pp.address, pp.phone_number, pp.facebook_url, pp.linkedin_url, pp.instagram_url, pp.cover_image_url, pp.required_doc_url
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN publisher_profiles pp ON u.id = pp.user_id
        WHERE u.id = :id
    ";
    $stmt_fetch = $db->prepare($query_fetch);
    $stmt_fetch->bindParam(':id', $user_id, PDO::PARAM_INT);
    $stmt_fetch->execute();
    $updated_user = $stmt_fetch->fetch(PDO::FETCH_ASSOC);
    // Only include required_doc_url if the user is admin
    if ($user_role !== 'admin' && isset($updated_user['required_doc_url'])) {
        unset($updated_user['required_doc_url']);
    }

    http_response_code(200);
    echo json_encode([
        "message" => "Profile updated successfully.",
        "user" => $updated_user
    ]);

} catch (PDOException $e) {
    if ($db->inTransaction()) { $db->rollBack(); }
    http_response_code(503);
    echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
} catch (Exception $e) {
    if ($db->inTransaction()) { $db->rollBack(); }
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>
