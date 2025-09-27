# Manual QA Workflow for News Ingestion Pipeline

This document outlines the manual quality assurance process for the news ingestion pipeline.

## Daily QA Tasks

### 1. System Health Check (5 minutes)

**Access**: Dashboard → Health Status

**Check**:
- [ ] System status is "healthy" or "degraded" (not "unhealthy")
- [ ] Last ingestion was within 6 hours
- [ ] At least 70% of sources are healthy
- [ ] No critical alerts

**Action if issues**:
- Check logs for error details
- Verify source URLs are accessible
- Restart scheduler if needed

### 2. Cost Monitoring (2 minutes)

**Access**: Dashboard → Cost Statistics

**Check**:
- [ ] Daily budget usage is under 80%
- [ ] Monthly budget usage is under 70%
- [ ] Cost per article is reasonable (< $0.05)
- [ ] No unexpected cost spikes

**Action if issues**:
- Review cost optimization recommendations
- Adjust batch sizes or processing frequency
- Check for duplicate processing

### 3. Processing Quality Review (10 minutes)

**Access**: Dashboard → Recent Articles

**Sample Check** (review 10 random articles):
- [ ] Articles have appropriate industry classification
- [ ] Categories are accurate (Launch, Financials, etc.)
- [ ] Summaries are coherent and informative
- [ ] Confidence scores are reasonable (> 0.6)
- [ ] Key entities are relevant

**Flag for Review**:
- Articles with confidence < 0.6
- Misclassified industries
- Poor quality summaries
- Missing key entities

## Weekly QA Tasks

### 1. Source Performance Review (15 minutes)

**Access**: Dashboard → Sources

**Check Each Source**:
- [ ] Success rate > 80%
- [ ] Error count < 5 in last week
- [ ] Response time < 5 seconds
- [ ] Articles are relevant and recent

**Actions**:
- Deactivate sources with poor performance
- Investigate sources with high error rates
- Update source priorities if needed

### 2. Deduplication Quality Check (10 minutes)

**Access**: API → `/api/news-ingestion/articles?search=tesla`

**Test Cases**:
1. **Same Title Test**: Search for recent Tesla articles
   - [ ] No exact duplicate titles
   - [ ] Similar titles are properly differentiated

2. **URL Canonicalization Test**: Check articles with UTM parameters
   - [ ] URLs are normalized correctly
   - [ ] No duplicates from same source with different UTM params

3. **Cross-Source Duplicates**: Look for same news across sources
   - [ ] Duplicates are properly detected
   - [ ] Original source is preserved

### 3. Content Extraction Quality (15 minutes)

**Access**: Dashboard → Recent Articles → View Full Content

**Sample Check** (5 articles):
- [ ] Full content is extracted (not just snippet)
- [ ] Content is clean (no navigation, ads)
- [ ] Author information is captured
- [ ] Published date is accurate
- [ ] Images are extracted when present

**Test Edge Cases**:
- Paywalled content (should mark as partial)
- Very short articles (< 100 words)
- Articles with heavy JavaScript content

### 4. GPT Classification Accuracy (20 minutes)

**Manual Review Process**:

1. **Select Sample**: 20 articles from last week
2. **Industry Classification**:
   - [ ] Automotive articles are classified as "Automotive"
   - [ ] Tech articles are classified as "Tech"
   - [ ] Finance articles are classified as "Finance"
   - [ ] Unknown articles are properly flagged

3. **Category Classification**:
   - [ ] Product launches are "Launch"
   - [ ] Financial news is "Financials"
   - [ ] Competitor news is "Competitor"
   - [ ] Regulatory news is "Regulation"

4. **Summary Quality**:
   - [ ] Summaries capture key points
   - [ ] Length is appropriate (2-4 sentences)
   - [ ] No repetitive or generic content

5. **Entity Extraction**:
   - [ ] Company names are correctly identified
   - [ ] Product names are captured
   - [ ] Key people are mentioned

**Calculate Accuracy**:
- Industry accuracy: ___/20 correct
- Category accuracy: ___/20 correct
- Summary quality: ___/20 good

## Monthly QA Tasks

### 1. Performance Analysis (30 minutes)

**Metrics to Review**:
- [ ] Average processing time per article
- [ ] Success rate trends
- [ ] Cost trends and efficiency
- [ ] Source reliability over time

**Generate Report**:
```bash
# Get monthly statistics
curl http://localhost:5000/api/news-ingestion/stats

# Get cost statistics
curl http://localhost:5000/api/news-ingestion/cost-stats

# Get processing logs
curl http://localhost:5000/api/news-ingestion/logs?startDate=2023-11-01&endDate=2023-12-01
```

### 2. Data Quality Audit (45 minutes)

**Database Health**:
- [ ] No orphaned records
- [ ] Proper indexing performance
- [ ] Data consistency checks

**Sample Data Review**:
- [ ] 100 random articles for data completeness
- [ ] Check for missing required fields
- [ ] Verify data types and formats

**Cleanup Tasks**:
- [ ] Remove old duplicate records
- [ ] Clean up failed processing attempts
- [ ] Archive old ingestion logs

### 3. Source Evaluation (30 minutes)

**New Source Candidates**:
- Research potential new sources
- Test RSS feed accessibility
- Evaluate content quality and relevance

**Existing Source Review**:
- Check for source changes (URL updates, format changes)
- Evaluate content quality trends
- Consider deactivating poor performers

## QA Tools and Scripts

### 1. Manual Testing Scripts

**Test Feed Fetching**:
```bash
# Test individual source
node -e "
const newsFetcher = require('./server/services/newsFetcher');
const source = { sourceId: 'test', name: 'Test', type: 'RSS', url: 'https://example.com/rss' };
newsFetcher.processSource(source).then(console.log);
"
```

**Test Content Extraction**:
```bash
# Test content extraction
node -e "
const contentExtractor = require('./server/services/contentExtractor');
contentExtractor.extractContent('https://example.com/article').then(console.log);
"
```

**Test GPT Processing**:
```bash
# Test GPT processing
node -e "
const gptProcessor = require('./server/services/gptProcessor');
gptProcessor.processUnprocessedArticles(5).then(console.log);
"
```

### 2. Data Validation Queries

**Check for Missing Data**:
```javascript
// MongoDB queries for data validation
db.processedarticles.find({
  $or: [
    { title: { $exists: false } },
    { summary: { $exists: false } },
    { industry: { $exists: false } },
    { category: { $exists: false } }
  ]
}).count();

// Check for low confidence articles
db.processedarticles.find({
  confidence: { $lt: 0.6 },
  gptStatus: 'processed'
}).count();

// Check for processing failures
db.processedarticles.find({
  gptStatus: 'failed'
}).count();
```

### 3. Performance Monitoring

**Database Performance**:
```javascript
// Check slow queries
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(5);

// Check index usage
db.processedarticles.getIndexes();
```

## QA Checklist Templates

### Daily QA Checklist
```
Date: ___________
Reviewer: ___________

System Health:
□ System status: Healthy/Degraded/Unhealthy
□ Last ingestion: Within 6 hours
□ Sources healthy: >70%
□ Critical alerts: None

Cost Monitoring:
□ Daily budget: <80% used
□ Monthly budget: <70% used
□ Cost per article: <$0.05
□ No cost spikes

Processing Quality:
□ Sample size: 10 articles
□ Industry accuracy: ___/10
□ Category accuracy: ___/10
□ Summary quality: ___/10
□ Confidence scores: >0.6

Issues Found:
□ None
□ Issues noted: _________________

Action Items:
□ None
□ Actions: ____________________
```

### Weekly QA Checklist
```
Week of: ___________
Reviewer: ___________

Source Performance:
□ Sources reviewed: _____
□ Sources with issues: _____
□ Actions taken: ________________

Deduplication:
□ Same title test: Pass/Fail
□ URL canonicalization: Pass/Fail
□ Cross-source duplicates: Pass/Fail

Content Extraction:
□ Sample size: 5 articles
□ Full content extracted: ___/5
□ Content quality: Good/Poor
□ Edge cases handled: Pass/Fail

GPT Classification:
□ Sample size: 20 articles
□ Industry accuracy: ___/20
□ Category accuracy: ___/20
□ Summary quality: ___/20
□ Entity extraction: ___/20

Overall Quality Score: ___/100
Recommendations: ________________
```

## Issue Escalation

### Critical Issues (Immediate Action)
- System status "unhealthy"
- Daily budget exceeded
- All sources failing
- Database connection issues

### High Priority Issues (Same Day)
- Processing rate <50%
- Multiple source failures
- High error rates
- Cost spikes >200%

### Medium Priority Issues (Within 3 Days)
- Classification accuracy <70%
- Content extraction failures >20%
- Performance degradation
- Source quality issues

### Low Priority Issues (Next Sprint)
- Minor classification errors
- UI improvements
- Performance optimizations
- Documentation updates

## QA Metrics and KPIs

### Daily Metrics
- System uptime: >99%
- Processing success rate: >95%
- Cost efficiency: <$0.05/article
- Response time: <30 seconds

### Weekly Metrics
- Classification accuracy: >85%
- Source reliability: >80%
- Content extraction success: >90%
- Deduplication effectiveness: >95%

### Monthly Metrics
- Cost per article trend
- Processing volume growth
- Source performance trends
- User satisfaction scores

## Continuous Improvement

### Monthly QA Review Meeting
1. Review QA metrics and trends
2. Identify improvement opportunities
3. Update QA processes and checklists
4. Plan optimization initiatives
5. Share learnings with development team

### Quarterly QA Process Review
1. Evaluate QA effectiveness
2. Update testing procedures
3. Improve automation opportunities
4. Training and knowledge sharing
5. Process documentation updates
