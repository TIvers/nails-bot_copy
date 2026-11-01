<?php

require_once 'DatabaseClient.php';
$dbClient = new DatabaseClient();
$query = "
ALTER TABLE catalog_products 
ADD CONSTRAINT catalog_products_id_product_unique UNIQUE (id_product);
";

$result = $dbClient->psqlQuery($query);
print_r($result);
?>