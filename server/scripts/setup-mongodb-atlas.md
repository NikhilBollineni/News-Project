# MongoDB Atlas Setup Guide

## 🗄️ **MongoDB Atlas Setup Instructions**

### **Step 1: Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project called "Automotive News Platform"

### **Step 2: Create a Free Cluster**
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to you
5. Give your cluster a name: "automotive-news-cluster"
6. Click "Create Cluster"

### **Step 3: Create Database User**
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username: `automotive-news`
5. Create a strong password: `automotive-news-2024` (or your preferred password)
6. Set privileges to "Read and write to any database"
7. Click "Add User"

### **Step 4: Whitelist IP Addresses**
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0) for development
4. Or add your specific IP address for production
5. Click "Confirm"

### **Step 5: Get Connection String**
1. Go to "Clusters" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as driver
5. Copy the connection string
6. Replace `<password>` with your actual password
7. Replace `<dbname>` with `automotive-news`

### **Step 6: Update Environment Variables**
Update your `.env` file or `env.example` with:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://automotive-news:automotive-news-2024@cluster0.mongodb.net/automotive-news?retryWrites=true&w=majority

# Server Configuration
PORT=5009
NODE_ENV=production

# Client Configuration
NEXT_PUBLIC_API_URL=http://localhost:5009/api

# OpenAI API (already configured)
OPENAI_API_KEY=your-openai-api-key-here

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-for-production
```

### **Step 7: Test Connection**
Run the production server:
```bash
node server/production-automotive-server.js
```

Check health endpoint:
```bash
curl http://localhost:5009/api/health
```

### **Step 8: Initialize Database**
Once connected, the server will automatically:
- Create the database collections
- Set up indexes
- Initialize system stats
- Start fetching news from RSS feeds

### **Expected Collections**
After successful connection, you should see these collections in MongoDB Atlas:
- `automotive_articles` - Main articles collection
- `automotive_publishers` - Publisher information
- `system_stats` - Platform analytics
- `users` - User management (future)

### **Troubleshooting**

#### Connection Issues:
1. **Authentication Failed**: Check username/password in connection string
2. **Network Access Denied**: Add your IP to whitelist
3. **Cluster Not Ready**: Wait for cluster to finish provisioning
4. **Wrong Connection String**: Ensure you're using the correct format

#### Performance Issues:
1. **Slow Queries**: Check if indexes are created properly
2. **Connection Timeouts**: Increase timeout values in connection options
3. **Rate Limiting**: MongoDB Atlas free tier has connection limits

### **Production Considerations**
1. **Security**: Use environment variables for sensitive data
2. **Monitoring**: Set up MongoDB Atlas monitoring alerts
3. **Backup**: Enable automatic backups for production
4. **Scaling**: Upgrade to paid tiers for better performance
5. **SSL**: Ensure SSL/TLS connections are enabled

### **Next Steps**
1. Test the connection
2. Verify data is being stored
3. Check indexes are created
4. Monitor performance
5. Set up regular backups
