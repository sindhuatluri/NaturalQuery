SELECT (
  SELECT 
    schema_name = s.name,
    tables = (
      SELECT 
        table_name = t.name,
        columns = (
          SELECT 
            column_name = c.name,
            data_type = tp.name,
            max_length = c.max_length,
            is_nullable = c.is_nullable,
            is_identity = c.is_identity,
            column_default = dc.definition,
            is_primary_key = CASE 
              WHEN pk.column_id IS NOT NULL THEN 1 
              ELSE 0 
            END
          FROM sys.columns c
          JOIN sys.types tp ON c.user_type_id = tp.user_type_id
          LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
          LEFT JOIN (
            SELECT ic.object_id, ic.column_id
            FROM sys.index_columns ic
            JOIN sys.indexes i ON ic.object_id = i.object_id 
              AND ic.index_id = i.index_id
            WHERE i.is_primary_key = 1
          ) pk ON c.object_id = pk.object_id 
            AND c.column_id = pk.column_id
          WHERE c.object_id = t.object_id
          FOR JSON PATH
        )
      FROM sys.tables t
      WHERE t.schema_id = s.schema_id
      FOR JSON PATH
    )
  FROM sys.schemas s
  WHERE s.name NOT IN ('sys', 'guest', 'INFORMATION_SCHEMA')
  FOR JSON PATH
) AS database_schema;
