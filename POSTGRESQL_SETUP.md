# PostgreSQL Local Setup Guide

## Quick Setup (Recommended)

### Step 1: Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, add Homebrew to your PATH:
```bash
# For Apple Silicon (M1/M2/M3 Mac)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# For Intel Mac
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

Verify:
```bash
brew --version
```

---

### Step 2: Install PostgreSQL
```bash
brew install postgresql@16
```

---

### Step 3: Start PostgreSQL
```bash
brew services start postgresql@16
```

Verify it's running:
```bash
brew services list | grep postgresql
```

You should see: `postgresql@16  started`

---

### Step 4: Create Database and User

Run the provided SQL script:
```bash
cd /Users/ewidedev.2/Documents/REACT_Project/Sports_Content_Creation

# Try with postgres user
psql postgres -f scripts/setup-postgres.sql

# OR if that fails, try with your current user
psql -f scripts/setup-postgres.sql
```

**OR** do it manually:
```bash
# Connect to PostgreSQL
psql postgres

# Then run these SQL commands:
```

```sql
CREATE DATABASE prostudio;
CREATE USER prostudio WITH PASSWORD 'prostudio';
GRANT ALL PRIVILEGES ON DATABASE prostudio TO prostudio;
\c prostudio
GRANT ALL ON SCHEMA public TO prostudio;
\q
```

---

### Step 5: Run Migrations and Seed
```bash
cd /Users/ewidedev.2/Documents/REACT_Project/Sports_Content_Creation

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with initial data
npm run prisma:seed
```

---

### Step 6: Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

**Login Credentials:**
- Admin: `admin@prostudio.dev` / `password123`
- User: `user@prostudio.dev` / `password123`

---

## Troubleshooting

### Issue: "psql: command not found"
**Solution:** PostgreSQL is not installed or not in PATH.

```bash
# Check installation
brew list postgresql@16

# Add to PATH (Apple Silicon)
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile

# Add to PATH (Intel Mac)
echo 'export PATH="/usr/local/opt/postgresql@16/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

---

### Issue: "Connection refused"
**Solution:** PostgreSQL service is not running.

```bash
# Start the service
brew services start postgresql@16

# Check status
brew services list | grep postgresql

# View logs if there's an issue
tail -f /opt/homebrew/var/log/postgresql@16.log
```

---

### Issue: "role 'postgres' does not exist"
**Solution:** Use your current macOS username instead.

```bash
# Check your username
whoami

# Connect with your username
psql -U $(whoami) postgres
```

Then create the database manually with SQL commands above.

---

### Issue: "database 'prostudio' already exists"
**Solution:** Drop and recreate it.

```bash
psql postgres -c "DROP DATABASE IF EXISTS prostudio;"
psql postgres -c "DROP USER IF EXISTS prostudio;"
psql postgres -f scripts/setup-postgres.sql
```

---

### Issue: Port 5432 already in use
**Solution:** Another PostgreSQL instance is running.

```bash
# Check what's using port 5432
lsof -i :5432

# Stop all PostgreSQL services
brew services stop postgresql@16
brew services stop postgresql  # if other versions exist

# Start the correct version
brew services start postgresql@16
```

---

## Manual Database Setup (Alternative)

If automated scripts don't work, do it manually:

1. **Connect to PostgreSQL:**
```bash
psql postgres
```

2. **Create database:**
```sql
CREATE DATABASE prostudio;
```

3. **Create user:**
```sql
CREATE USER prostudio WITH PASSWORD 'prostudio';
```

4. **Grant privileges:**
```sql
GRANT ALL PRIVILEGES ON DATABASE prostudio TO prostudio;
```

5. **Switch to database:**
```sql
\c prostudio
```

6. **Grant schema privileges:**
```sql
GRANT ALL ON SCHEMA public TO prostudio;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prostudio;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prostudio;
```

7. **Exit:**
```sql
\q
```

8. **Run migrations:**
```bash
npm run prisma:migrate
npm run prisma:seed
```

---

## Verify Setup

Check if everything is working:

```bash
# Test database connection
psql -U prostudio -d prostudio -c "SELECT version();"

# Check Prisma connection
npx prisma studio
```

This should open Prisma Studio at http://localhost:5555

---

## Stop/Start PostgreSQL

```bash
# Stop
brew services stop postgresql@16

# Start
brew services start postgresql@16

# Restart
brew services restart postgresql@16

# Check status
brew services list
```

---

## Uninstall (if needed)

```bash
# Stop service
brew services stop postgresql@16

# Uninstall
brew uninstall postgresql@16

# Remove data (optional)
rm -rf /opt/homebrew/var/postgresql@16
```

---

## Database Credentials

- **Host:** localhost
- **Port:** 5432
- **Database:** prostudio
- **User:** prostudio
- **Password:** prostudio
- **Connection String:** `postgresql://prostudio:prostudio@localhost:5432/prostudio?schema=public`

---

## Next Steps

Once database is set up:

1. ✅ Database running
2. ✅ Migrations applied
3. ✅ Data seeded
4. 🚀 Run `npm run dev`
5. 🎨 Test all canvas editor features!

All 5 new canvas features (Filters, Gradients, Alignment, Text Effects, Crop) will work perfectly!

---

Need help? Check:
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Homebrew Docs](https://docs.brew.sh/)
- [Prisma Docs](https://www.prisma.io/docs/)
