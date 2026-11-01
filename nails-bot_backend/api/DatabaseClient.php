<?php
class DatabaseClient
{  
    
    private $host;
    private $port;
    private $dbname;
    private $user;
    private $password;
    private $dsn;
    function __construct(){
        $config = [
            'DB_HOST' => getenv('DB_HOST'),
            'DB_PORT' => getenv('DB_PORT'),
            'DB_NAME' => getenv('DB_NAME'),
            'DB_USER' => getenv('DB_USER'),
            'DB_PASSWORD' => getenv('DB_PASSWORD'),
        ];

        foreach ($config as $name => $value) {
            if ($value === false || $value === '') {
                throw new RuntimeException("Missing required database setting: $name");
            }
        }

        $this->host = $config['DB_HOST'];
        $this->port = $config['DB_PORT'];
        $this->dbname = $config['DB_NAME'];
        $this->user = $config['DB_USER'];
        $this->password = $config['DB_PASSWORD'];

        $this->dsn = "pgsql:host=$this->host;port=$this->port;dbname=$this->dbname;";
        $this->connection = $this->getDbConnection();
        $connection = $this->connection;
        if ($connection instanceof PDO) {
            echo json_encode(["success" => true, "message" => "Connected to PostgreSQL!"]);
        } else {
            echo json_encode($connection);
        }

    }
    function getDbConnection() {

        try {
            $pdo = new PDO($this->dsn, $this->user, $this->password);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            return $pdo;
        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => "Connection failed: " . $e->getMessage()]);
            exit;
        }

    }

    function psqlQuery($query, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($query);

            $stmt->execute($params);

            $queryType = strtoupper(explode(' ', trim($query))[0]);

            switch ($queryType) {
                case 'SELECT':
                    $result = $stmt->fetchAll();
                    return [
                        'success' => true,
                        'data' => $result,
                        'rowCount' => $stmt->rowCount()
                    ];

                case 'INSERT':
                    return [
                        'success' => true,
                        'lastInsertId' => $this->connection->lastInsertId(),
                        'rowCount' => $stmt->rowCount()
                    ];

                case 'UPDATE':
                case 'DELETE':
                    return [
                        'success' => true,
                        'rowCount' => $stmt->rowCount()
                    ];

                default:
                    $result = $stmt->fetchAll();
                    return [
                        'success' => true,
                        'data' => $result,
                        'message' => 'Query executed successfully'
                    ];
            }

        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Query failed: ' . $e->getMessage(),
                'errorCode' => $e->getCode()
            ];
        }
    }

    function closeConnection()
    {
        $this->connection = null;
    }

    function __destruct()
    {
        $this->closeConnection();
    }
}
?>