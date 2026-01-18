# Database Setup

## Local Development with Docker

1. Start the database containers:
   ```bash
   docker-compose up -d sqlserver
   ```

2. Wait for SQL Server to be ready (check logs):
   ```bash
   docker logs -f toolshare-db
   ```

3. Connect to SQL Server and run the schema:
   ```bash
   # Using sqlcmd in the container
   docker exec -it toolshare-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "ToolShare123!"
   ```

   Then in sqlcmd:
   ```sql
   CREATE DATABASE ToolShare;
   GO
   USE ToolShare;
   GO
   -- Paste contents of schema.sql
   -- Paste contents of seed.sql (optional, for test data)
   ```

4. Start Data API Builder:
   ```bash
   docker-compose up -d dataapi
   ```

5. Verify DAB is running:
   - GraphQL Playground: http://localhost:5000/graphql
   - REST API: http://localhost:5000/api

## Connection Strings

### Local Development
```
Server=localhost;Database=ToolShare;User=sa;Password=ToolShare123!;TrustServerCertificate=True;
```

### Azure SQL
```
Server=your-server.database.windows.net;Database=ToolShare;Authentication=Active Directory Default;
```

## Schema Changes

1. Create a new migration file in `database/migrations/` with naming convention:
   `YYYYMMDD_description.sql`

2. Apply to local database:
   ```bash
   docker exec -it toolshare-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "ToolShare123!" -d ToolShare -i /path/to/migration.sql
   ```

3. Update `schema.sql` to reflect current state

4. For Azure, use Azure Data Studio or Azure Portal to apply migrations
