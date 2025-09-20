# Deployment Notes for Logo Persistence

## Problem
The logo disappears after container restart because files are stored in non-persistent directories.

## Solution
Store logo files in a persistent directory that survives container restarts.

## Implementation

### 1. Persistent Directory Structure
```
/app/data/
├── uploads/          # Logo files
└── settings/         # Other persistent data
```

### 2. Docker Volume Mapping
The `/app/data` directory should be mapped to a persistent volume in the container.

### 3. Environment Variables
- `NODE_ENV=production` - Enables persistent storage path
- Logo files stored in `/app/data/uploads/`
- Metadata stored in PostgreSQL database

### 4. Coolify Configuration
In Coolify, ensure the following volume mapping:
```
Host Path: /opt/coolify/data/goldenhorse/uploads
Container Path: /app/data
```

### 5. Manual Setup (if needed)
If the persistent directory doesn't exist, create it manually:
```bash
# Inside the container
mkdir -p /app/data/uploads
chmod 755 /app/data/uploads
```

### 6. Migration from Old System
If there are existing logos in the old system, they need to be migrated:
1. Check `/app/server/uploads/` for existing files
2. Move them to `/app/data/uploads/`
3. Update database records with new paths

## Testing
1. Upload a logo
2. Restart the container
3. Check if logo is still visible
4. Verify files exist in `/app/data/uploads/`

## Troubleshooting

### Logo Upload Fails (500 Error)
1. Check container logs for detailed error messages
2. Verify `/app/data/uploads/` directory exists and is writable
3. Check database connection for metadata storage

### Logo Disappears After Restart
1. Verify volume mapping in Coolify
2. Check if `/app/data` is properly mounted
3. Ensure files are in the correct persistent directory

### Permission Issues
```bash
# Fix permissions if needed
chown -R node:node /app/data
chmod -R 755 /app/data
```
