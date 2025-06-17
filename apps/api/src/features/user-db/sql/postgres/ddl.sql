WITH 
-- Generate table creation statements with columns
table_columns AS (
    SELECT 
        table_schema,
        table_name,
        format(
            'CREATE TABLE IF NOT EXISTS %s (\n%s\n);',
            quote_ident(table_schema) || '.' || quote_ident(table_name),
            string_agg(
                format(
                    '    %s %s%s%s',
                    quote_ident(column_name),
                    data_type,
                    CASE 
                        WHEN character_maximum_length IS NOT NULL THEN format('(%s)', character_maximum_length)
                        ELSE '' 
                    END,
                    CASE 
                        WHEN is_nullable = 'NO' THEN ' NOT NULL'
                        ELSE '' 
                    END
                ),
                ',\n'
                ORDER BY ordinal_position
            )
        ) as ddl
    FROM information_schema.columns 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    GROUP BY table_schema, table_name
),

-- Generate constraint statements (Primary and Foreign Keys)
constraints AS (
    -- Primary Keys
    SELECT 
        tc.table_schema,
        tc.table_name,
        format(
            'ALTER TABLE %s ADD PRIMARY KEY (%s);',
            quote_ident(tc.table_schema) || '.' || quote_ident(tc.table_name),
            string_agg(quote_ident(kcu.column_name), ', ' ORDER BY kcu.ordinal_position)
        ) as constraint_ddl,
        1 as constraint_order -- Ensure PKs come before FKs
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        USING (constraint_name, table_schema)
    WHERE tc.constraint_type = 'PRIMARY KEY'
    GROUP BY tc.table_schema, tc.table_name

    UNION ALL

    -- Foreign Keys
    SELECT 
        kcu.table_schema,
        kcu.table_name,
        format(
            'ALTER TABLE %s ADD FOREIGN KEY (%s) REFERENCES %s (%s);',
            quote_ident(kcu.table_schema) || '.' || quote_ident(kcu.table_name),
            string_agg(quote_ident(kcu.column_name), ', '),
            quote_ident(ccu.table_schema) || '.' || quote_ident(ccu.table_name),
            string_agg(quote_ident(ccu.column_name), ', ')
        ) as constraint_ddl,
        2 as constraint_order
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        USING (constraint_name, table_schema)
    JOIN information_schema.constraint_column_usage ccu 
        USING (constraint_name, table_schema)
    WHERE tc.constraint_type = 'FOREIGN KEY'
    GROUP BY kcu.table_schema, kcu.table_name, ccu.table_schema, ccu.table_name
),

-- Generate column documentation
column_docs AS (
    SELECT 
        c.table_schema,
        c.table_name,
        string_agg(
            format(
                '-- Column %s: %s', 
                quote_ident(c.column_name),
                COALESCE(pd.description, '')
            ),
            E'\n' 
            ORDER BY c.ordinal_position
        ) as descriptions
    FROM information_schema.columns c
    LEFT JOIN pg_class pgc 
        ON pgc.relname = c.table_name
    LEFT JOIN pg_namespace pgn 
        ON pgn.nspname = c.table_schema
    LEFT JOIN pg_description pd 
        ON pd.objoid = pgc.oid 
        AND pd.objsubid = c.ordinal_position
    WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
    GROUP BY c.table_schema, c.table_name
)

-- Combine all components into final DDL
SELECT format(
    '-- Table: %s\n%s\n%s\n%s',
    quote_ident(t.table_schema) || '.' || quote_ident(t.table_name),
    COALESCE(d.descriptions, ''),
    t.ddl,
    COALESCE(string_agg(c.constraint_ddl, E'\n' ORDER BY c.constraint_order), '')
) as complete_ddl
FROM table_columns t
LEFT JOIN column_docs d 
    USING (table_schema, table_name)
LEFT JOIN constraints c 
    USING (table_schema, table_name)
GROUP BY 
    t.table_schema, 
    t.table_name, 
    t.ddl, 
    d.descriptions
ORDER BY 
    t.table_schema, 
    t.table_name;
    
    
 
