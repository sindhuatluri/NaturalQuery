SELECT JSON_OBJECT(
  'database_structure', (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'schema_name', s.schema_name,
        'tables', (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'table_name', t.table_name,
              'columns', (
                SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'column_name', c.column_name,
                    'data_type', c.data_type,
                    'is_nullable', c.is_nullable,
                    'column_default', c.column_default,
                    'character_maximum_length', c.character_maximum_length,
                    'column_type', c.column_type,
                    'column_key', c.column_key
                  )
                )
                FROM (
                  SELECT *
                  FROM information_schema.columns
                  WHERE table_schema = s.schema_name
                  AND table_name = t.table_name
                  ORDER BY ordinal_position
                ) c
              )
            )
          )
          FROM information_schema.tables t
          WHERE t.table_schema = s.schema_name
          AND t.table_type = 'BASE TABLE'
        )
      )
    )
    FROM information_schema.schemata s
    WHERE s.schema_name NOT IN ('mysql', 'information_schema', 
                            'performance_schema', 'sys')
  )
) AS database_schema;
