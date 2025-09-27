const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5016;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Mock users database
const users = [
  {
    id: '1',
    email: 'demo@automotive.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Automotive Professional',
    selectedIndustries: ['automotive']
  }
];

// JWT Secret
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Simple Auth Server'
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.name.split(' ')[0] || user.name,
          lastName: user.name.split(' ').slice(1).join(' ') || '',
          name: user.name,
          isEmailVerified: true,
          role: 'user',
          isPremium: false,
          selectedIndustries: user.selectedIndustries,
          notificationPreferences: {
            email: true,
            push: true,
            sms: false
          },
          language: 'en',
          timezone: 'UTC',
          loginCount: 1,
          createdAt: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password: hashedPassword,
      name,
      selectedIndustries: ['automotive']
    };
    
    users.push(newUser);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.name.split(' ')[0] || newUser.name,
          lastName: newUser.name.split(' ').slice(1).join(' ') || '',
          name: newUser.name,
          isEmailVerified: true,
          role: 'user',
          isPremium: false,
          selectedIndustries: newUser.selectedIndustries,
          notificationPreferences: {
            email: true,
            push: true,
            sms: false
          },
          language: 'en',
          timezone: 'UTC',
          loginCount: 1,
          createdAt: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.name.split(' ')[0] || user.name,
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        name: user.name,
        isEmailVerified: true,
        role: 'user',
        isPremium: false,
        selectedIndustries: user.selectedIndustries,
        notificationPreferences: {
          email: true,
          push: true,
          sms: false
        },
        language: 'en',
        timezone: 'UTC',
        loginCount: 1,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Mock news ingestion endpoints
app.get('/api/news-ingestion/articles', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Tesla launches new Model 3 in Europe',
        summary: 'Tesla has launched the new Model 3 in European markets with improved range and enhanced autopilot features.',
        industry: 'Automotive',
        category: 'Launch',
        confidence: 0.9,
        publishedAt: new Date().toISOString(),
        source: 'Tesla News'
      },
      {
        id: '2',
        title: 'Toyota reports strong Q3 earnings',
        summary: 'Toyota reported strong third quarter earnings that exceeded analyst expectations.',
        industry: 'Automotive',
        category: 'Financials',
        confidence: 0.8,
        publishedAt: new Date().toISOString(),
        source: 'Automotive News'
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 2,
      limit: 20,
      hasNextPage: false,
      hasPrevPage: false
    }
  });
});

app.get('/api/news-ingestion/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      articles: {
        total: 2,
        processed: 2,
        pending: 0,
        failed: 0,
        duplicates: 0,
        reviewRequired: 0
      },
      industries: [
        { _id: 'Automotive', count: 2 }
      ],
      categories: [
        { _id: 'Launch', count: 1 },
        { _id: 'Financials', count: 1 }
      ],
      sources: {
        total: 1,
        active: 1,
        healthy: 1
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Auth Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`📰 News endpoint: http://localhost:${PORT}/api/news-ingestion/articles`);
});
