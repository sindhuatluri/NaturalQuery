WITH TableInfo AS (
    SELECT 
        SCHEMA_NAME(t.schema_id) AS schema_name,
        t.name AS table_name,
        t.object_id
    FROM sys.tables t
),
ColumnInfo AS (
    SELECT 
        SCHEMA_NAME(t.schema_id) AS schema_name,
        t.name AS table_name,
        c.name AS column_name,
        TYPE_NAME(c.user_type_id) AS data_type,
        c.max_length,
        c.is_nullable,
        c.column_id
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
),
PKInfo AS (
    SELECT 
        SCHEMA_NAME(t.schema_id) AS schema_name,
        t.name AS table_name,
        STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS pk_columns
    FROM sys.tables t
    JOIN sys.indexes i ON t.object_id = i.object_id
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.is_primary_key = 1
    GROUP BY t.schema_id, t.name
)
SELECT 
    CONCAT(
        '-- Table: ', ci.schema_name, '.', ci.table_name, CHAR(13) + CHAR(10),
        'CREATE TABLE ', QUOTENAME(ci.schema_name), '.', QUOTENAME(ci.table_name), ' (', CHAR(13) + CHAR(10),
        STRING_AGG(
            CONCAT(
                '    ', QUOTENAME(ci.column_name), ' ',
                ci.data_type,
                CASE 
                    WHEN ci.data_type IN ('varchar', 'nvarchar', 'char', 'nchar') 
                    THEN CONCAT('(', IIF(ci.max_length = -1, 'MAX', CAST(ci.max_length AS VARCHAR)), ')')
                    ELSE ''
                END,
                CASE WHEN ci.is_nullable = 0 THEN ' NOT NULL' ELSE ' NULL' END
            ),
            ',' + CHAR(13) + CHAR(10)
        ) WITHIN GROUP (ORDER BY ci.column_id),
        CHAR(13) + CHAR(10), ');',
        CHAR(13) + CHAR(10),
        CASE 
            WHEN pk.pk_columns IS NOT NULL 
            THEN CONCAT(
                'ALTER TABLE ', QUOTENAME(ci.schema_name), '.', QUOTENAME(ci.table_name), 
                ' ADD PRIMARY KEY (', pk.pk_columns, ');'
            )
            ELSE ''
        END
    ) AS complete_ddl
FROM ColumnInfo ci
LEFT JOIN PKInfo pk ON ci.schema_name = pk.schema_name AND ci.table_name = pk.table_name
GROUP BY ci.schema_name, ci.table_name, pk.pk_columns;
