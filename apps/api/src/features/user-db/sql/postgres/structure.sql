SELECT json_build_object(
  'database_structure', (
    SELECT json_agg(json_build_object(
      'schema_name', schemas.schema_name,
      'tables', (
        SELECT json_agg(json_build_object(
          'table_name', tables.table_name,
          'columns', (
            SELECT json_agg(json_build_object(
              'column_name', columns.column_name,
              'data_type', columns.data_type,
              'is_nullable', columns.is_nullable,
              'column_default', columns.column_default,
              'character_maximum_length', columns.character_maximum_length
            ) ORDER BY columns.ordinal_position)
            FROM information_schema.columns
            WHERE columns.table_schema = schemas.schema_name
            AND columns.table_name = tables.table_name
          )
        ))
        FROM information_schema.tables
        WHERE tables.table_schema = schemas.schema_name
        AND tables.table_type = 'BASE TABLE'
      )
    ))
    FROM information_schema.schemata schemas
    WHERE schemas.schema_name NOT IN ('pg_catalog', 'information_schema')
  )
) AS database_schema;
