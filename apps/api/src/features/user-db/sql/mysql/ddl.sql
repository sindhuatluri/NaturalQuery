SELECT 
    CONCAT(
        '-- Table: ', table_schema, '.', table_name, '\n',
        'CREATE TABLE IF NOT EXISTS `', table_schema, '`.`', table_name, '` (\n',
        GROUP_CONCAT(
            CONCAT('    `', column_name, '` ', 
                   column_type,
                   IF(is_nullable = 'NO', ' NOT NULL', ''),
                   IF(column_default IS NOT NULL, CONCAT(' DEFAULT ', 
                      CASE 
                          WHEN column_default = 'CURRENT_TIMESTAMP' THEN column_default
                          ELSE CONCAT('''', column_default, '''')
                      END), ''),
                   IF(extra != '', CONCAT(' ', extra), '')
            )
            ORDER BY ordinal_position
            SEPARATOR ',\n'
        ),
        '\n);\n',
        -- Primary Keys
        IFNULL(
            (SELECT CONCAT('ALTER TABLE `', table_schema, '`.`', table_name, 
                         '` ADD PRIMARY KEY (', 
                         GROUP_CONCAT(CONCAT('`', column_name, '`') ORDER BY seq_in_index), 
                         ');')
             FROM information_schema.statistics 
             WHERE index_name = 'PRIMARY' 
             AND table_schema = t.table_schema 
             AND table_name = t.table_name
             GROUP BY table_schema, table_name),
            ''
        ),
        '\n',
        -- Indexes (excluding primary key)
        IFNULL(
            (SELECT GROUP_CONCAT(
                CONCAT('CREATE ', IF(non_unique = 0, 'UNIQUE ', ''),
                       'INDEX `', index_name, '` ON `', table_schema, '`.`', table_name, '` (',
                       GROUP_CONCAT(CONCAT('`', column_name, '`') ORDER BY seq_in_index),
                       ');')
                ORDER BY index_name)
             FROM information_schema.statistics 
             WHERE index_name != 'PRIMARY'
             AND table_schema = t.table_schema 
             AND table_name = t.table_name
             GROUP BY table_schema, table_name),
            ''
        ),
        '\n',
        -- Foreign Keys
        IFNULL(
            (SELECT GROUP_CONCAT(
                CONCAT('ALTER TABLE `', table_schema, '`.`', table_name, '` ',
                       'ADD CONSTRAINT `', constraint_name, '` ',
                       'FOREIGN KEY (', GROUP_CONCAT(CONCAT('`', column_name, '`')), ') ',
                       'REFERENCES `', referenced_table_schema, '`.`', referenced_table_name, '` (',
                       GROUP_CONCAT(CONCAT('`', referenced_column_name, '`')), ');')
                SEPARATOR '\n')
             FROM information_schema.key_column_usage
             WHERE table_schema = t.table_schema 
             AND table_name = t.table_name
             AND referenced_table_name IS NOT NULL
             GROUP BY table_schema, table_name, constraint_name),
            ''
        ),
        '\n'
    ) as complete_ddl
FROM information_schema.columns t
WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
GROUP BY table_schema, table_name;
