<?php
function get_by_id_parent($id_parent, $dbClient) {
    if ($id_parent === 'NULL') {
        $query = "SELECT * 
                  FROM sections
                  WHERE id_parent IS NULL AND active = 'Y'";
    } elseif (!is_numeric($id_parent)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid id']);
        return;
    } else {
        $query = "SELECT * 
                  FROM sections
                  WHERE id_parent = $id_parent AND active = 'Y'";
    }

    $result = $dbClient->psqlQuery($query);
    $data = $result['data'];

    if (isset($data) && empty($data)) {
        $query = "SELECT id 
                  FROM catalog_products
                  WHERE id_section = $id_parent AND active = 'Y'";
        $result = $dbClient->psqlQuery($query);
        $data = $result['data'];
        return $data;
    } elseif (isset($data) && !empty($data)) {
        return $data;
    } else {
        return 'query error';
    }
}

function get_by_id_product($id_product, $dbClient)
{
    if (is_numeric($id_product)) {
        $query = "
            SELECT *
            FROM catalog_products
            WHERE id = :id AND active = 'Y';
        ";
        $params = [':id' => $id_product];
        $result = $dbClient->psqlQuery($query, $params);
        $data = $result['data'] ?? null;

        if (!empty($data)) {
            return $data;
        } else {
            echo 'query error';
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid id']);
        return;
    }
}

function get_delivery_tree($dbClient): array {
    $query = "
        WITH RECURSIVE delivery_tree AS (
            SELECT 
                internal_id,
                bitrix_id,
                parent_id,
                name,
                description,
                active,
                logotype,
                1 AS level
            FROM delivery_methods
            WHERE parent_id IS NULL AND active = 'Y'

            UNION ALL

            SELECT 
                dm.internal_id,
                dm.bitrix_id,
                dm.parent_id,
                dm.name,
                dm.description,
                dm.active,
                dm.logotype,
                dt.level + 1 AS level
            FROM delivery_methods dm
            INNER JOIN delivery_tree dt ON dm.parent_id = dt.bitrix_id
            WHERE dm.active = 'Y'
        )
        SELECT * FROM delivery_tree
        ORDER BY level;
    ";

    $result = $dbClient->psqlQuery($query);
    return is_array($result) ? $result : [];
}

function get_catalog($dbClient): array {
    $query = "
        WITH RECURSIVE section_tree AS (
            SELECT 
                id_section,
                id_parent,
                id,
                name,
                picture,
                detail_picture,
                1 AS level
            FROM sections
            WHERE id_parent IS NULL AND active = 'Y'
            
            UNION ALL
            
            SELECT 
                s.id_section,
                s.id_parent,
                s.id,
                s.name,
                s.picture,
                s.detail_picture,
                st.level + 1 AS level
            FROM sections s
            INNER JOIN section_tree st ON s.id_parent = st.id_section
            WHERE s.active = 'Y'
        )
        SELECT * FROM section_tree
        ORDER BY level;
    ";

    $result = $dbClient->psqlQuery($query);
    return is_array($result) ? $result : [];
}

function seachProduct($search, $dbClient) {
    $params = [':search' => "%" . (string)$search . "%"];
    $query = "
        SELECT *
        FROM catalog_products
        WHERE name ILIKE :search
          AND active = 'Y';
    ";

    $result = $dbClient->psqlQuery($query, $params);
    return is_array($result) ? $result : [];
}

function sync_delivery_methods($dbClient, $apiClient) {
    // Получаем доставки из Bitrix
    $deliveries = $apiClient->sale_delivery_list();

    foreach ($deliveries as $delivery) {
        $name = $delivery['NAME'];
        $bitrixId = $delivery['ID'];
        $parentId = $delivery['PARENT_ID'] ?? null;
        $active = $delivery['ACTIVE'];
        $description = $delivery['DESCRIPTION'] ?? null;
        $logotype = $delivery['LOGOTYPE'] ?? null;
        if ($parentId == 0) {
            $parentId = null;
        }

        // Вставка или обновление записи
        $query = "
            INSERT INTO delivery_methods (bitrix_id, parent_id, active, description, logotype, name)
            VALUES (:bitrix_id, :parent_id, :active, :description, :logotype, :name)
            ON CONFLICT (bitrix_id) DO UPDATE SET
                parent_id = EXCLUDED.parent_id,
                active = EXCLUDED.active,
                description = EXCLUDED.description,
                logotype = EXCLUDED.logotype,
                name = EXCLUDED.name;
        ";

        $params = [
            ':bitrix_id' => $bitrixId,
            ':parent_id' => $parentId,
            ':active' => $active,
            ':description' => $description,
            ':logotype' => $logotype,
            ':name' => $name
        ];

//        $query = "ALTER TABLE delivery_methods DROP CONSTRAINT delivery_methods_parent_id_fkey";
//        $params = [];


        $result = $dbClient->psqlQuery($query, $params);
        print_r($result);
    }

    return '✅ Синхронизация завершена: ' . count($deliveries) . ' доставок обработано.';
}

?>
