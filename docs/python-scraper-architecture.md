# PYTHON SCRAPER ARCHITECTURE
**Scholarship Data Collection System**

Status: planned / parked. This document is kept as a reference for a future external connector phase and should not be read as the current production data flow.

This document outlines the planned Python-based scraping system that could collect scholarship data from various sources and feed it into the Laravel backend in a later release.

---

## PLANNED SYSTEM OVERVIEW

The planned scraping system follows a **modular, distributed** architecture designed for:
- **Scalability**: Handle multiple sources simultaneously
- **Reliability**: Robust error handling and retry mechanisms
- **Maintainability**: Easy to add new sources and modify existing scrapers
- **Monitoring**: Comprehensive logging and alerting

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Scheduler     │    │   Scrapers      │    │   Database      │
│   (Celery)      │───▶│   (Scrapy)      │───▶│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitoring    │    │   Validation    │    │   Laravel API   │
│   (Prometheus)  │    │   & Cleaning    │    │   (Webhooks)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## TECHNOLOGY STACK

### **Core Framework**
- **Scrapy**: Web scraping framework
- **Celery**: Distributed task queue
- **Redis**: Message broker and caching
- **PostgreSQL**: Data storage
- **Docker**: Containerization

### **Supporting Libraries**
```python
# Web scraping and parsing
scrapy==2.11.0
beautifulsoup4==4.12.2
selenium==4.15.2
requests==2.31.0

# Data processing
pandas==2.1.4
numpy==1.24.3
python-dateutil==2.8.2

# Database and caching
psycopg2-binary==2.9.9
redis==5.0.1
sqlalchemy==2.0.23

# Task queue
celery==5.3.4
flower==2.0.1

# Monitoring and logging
prometheus-client==0.19.0
structlog==23.2.0
sentry-sdk==1.38.0

# Utilities
python-dotenv==1.0.0
pydantic==2.5.0
tenacity==8.2.3
```

---

## PROJECT STRUCTURE

```
scrape/
├── scrapers/
│   ├── __init__.py
│   ├── base/
│   │   ├── __init__.py
│   │   ├── spider.py              # Base spider class
│   │   ├── items.py               # Data models
│   │   └── pipelines.py           # Processing pipelines
│   ├── spiders/
│   │   ├── __init__.py
│   │   ├── scholarships_com.py    # Scholarships.com scraper
│   │   ├── fastweb_com.py         # Fastweb.com scraper
│   │   ├── cappex_com.py          # Cappex.com scraper
│   │   └── government_sites.py    # Government scholarship sites
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validators.py          # Data validation
│   │   ├── cleaners.py            # Data cleaning functions
│   │   ├── parsers.py             # Date/amount parsers
│   │   └── deduplicator.py        # Duplicate detection
│   └── settings/
│       ├── __init__.py
│       ├── base.py                # Base settings
│       ├── development.py         # Dev settings
│       └── production.py          # Production settings
├── database/
│   ├── __init__.py
│   ├── models.py                  # SQLAlchemy models
│   ├── connection.py              # Database connection
│   └── repositories.py            # Database operations
├── tasks/
│   ├── __init__.py
│   ├── scheduler.py               # Celery tasks
│   ├── monitoring.py              # Health checks
│   └── cleanup.py                 # Data cleanup tasks
├── api/
│   ├── __init__.py
│   ├── client.py                  # Laravel API client
│   └── webhooks.py                # Webhook notifications
├── config/
│   ├── __init__.py
│   ├── settings.py                # Application settings
│   ├── logging.py                 # Logging configuration
│   └── celery.py                  # Planned Celery configuration
├── tests/
│   ├── __init__.py
│   ├── test_spiders.py
│   ├── test_validators.py
│   └── fixtures/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
├── monitoring/
│   ├── prometheus.yml
│   ├── grafana_dashboard.json
│   └── alerts.yml
└── scripts/
    ├── deploy.sh
    ├── run_spider.py
    └── health_check.py
```

---

## CORE COMPONENTS

### 1. **BASE SPIDER CLASS**

```python
# scrapers/base/spider.py
import scrapy
from scrapy.http import Response
from typing import Generator, Dict, Any, Optional
from ..utils.validators import ScholarshipValidator
from ..utils.cleaners import DataCleaner
from .items import ScholarshipItem

class BaseScholarshipSpider(scrapy.Spider):
    """Base class for all scholarship scrapers"""
    
    # Override in child classes
    name = None
    source_name = None
    base_url = None
    
    # Rate limiting
    custom_settings = {
        'DOWNLOAD_DELAY': 2,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS': 1,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
        'AUTOTHROTTLE_ENABLED': True,
        'AUTOTHROTTLE_START_DELAY': 1,
        'AUTOTHROTTLE_MAX_DELAY': 10,
        'AUTOTHROTTLE_TARGET_CONCURRENCY': 2.0,
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.validator = ScholarshipValidator()
        self.cleaner = DataCleaner()
        self.scraped_count = 0
        self.error_count = 0
        
    def parse(self, response: Response) -> Generator:
        """Main parsing method - override in child classes"""
        raise NotImplementedError("Subclasses must implement parse method")
        
    def parse_scholarship(self, response: Response, **kwargs) -> Generator:
        """Parse individual scholarship page"""
        try:
            item = ScholarshipItem()
            
            # Extract basic information
            item['source_name'] = self.source_name
            item['source_url'] = response.url
            item['title'] = self.extract_title(response)
            item['description'] = self.extract_description(response)
            item['amount'] = self.extract_amount(response)
            item['deadline'] = self.extract_deadline(response)
            item['application_url'] = self.extract_application_url(response)
            
            # Extract eligibility criteria
            item['level'] = self.extract_level(response)
            item['fields_of_study'] = self.extract_fields(response)
            item['countries'] = self.extract_countries(response)
            item['gpa_requirement'] = self.extract_gpa(response)
            
            # Additional information
            item['requirements'] = self.extract_requirements(response)
            item['benefits'] = self.extract_benefits(response)
            item['provider_info'] = self.extract_provider(response)
            
            # Clean and validate data
            cleaned_item = self.cleaner.clean_scholarship_data(item)
            
            if self.validator.is_valid_scholarship(cleaned_item):
                self.scraped_count += 1
                yield cleaned_item
            else:
                self.logger.warning(f"Invalid scholarship data: {response.url}")
                self.error_count += 1
                
        except Exception as e:
            self.error_count += 1
            self.logger.error(f"Error parsing scholarship {response.url}: {str(e)}")
            
    def extract_title(self, response: Response) -> str:
        """Extract scholarship title - override in child classes"""
        raise NotImplementedError
        
    def extract_description(self, response: Response) -> str:
        """Extract description - override in child classes"""
        raise NotImplementedError
        
    # Additional extraction methods...
    
    def closed(self, reason):
        """Called when spider closes"""
        self.logger.info(f"""
        Spider {self.name} finished:
        - Reason: {reason}
        - Scraped: {self.scraped_count} scholarships
        - Errors: {self.error_count}
        - Success rate: {(self.scraped_count / (self.scraped_count + self.error_count)) * 100:.1f}%
        """)
```

### 2. **SCHOLARSHIP DATA MODEL**

```python
# scrapers/base/items.py
import scrapy
from itemloaders.processors import TakeFirst, MapCompose, Join
from w3lib.html import remove_tags
from datetime import datetime
from typing import Optional, List

class ScholarshipItem(scrapy.Item):
    # Source information
    source_name = scrapy.Field()
    source_url = scrapy.Field()
    scraped_at = scrapy.Field(
        input_processor=MapCompose(lambda x: datetime.now().isoformat())
    )
    
    # Basic information
    title = scrapy.Field(
        input_processor=MapCompose(remove_tags, str.strip),
        output_processor=TakeFirst()
    )
    description = scrapy.Field(
        input_processor=MapCompose(remove_tags, str.strip),
        output_processor=Join(' ')
    )
    amount = scrapy.Field()
    currency = scrapy.Field(output_processor=TakeFirst())
    type = scrapy.Field(output_processor=TakeFirst())
    
    # Dates
    deadline = scrapy.Field()
    start_date = scrapy.Field()
    duration_months = scrapy.Field()
    
    # Eligibility
    level = scrapy.Field()  # bachelor, master, doctorate, etc.
    fields_of_study = scrapy.Field()
    countries = scrapy.Field()
    nationalities = scrapy.Field()
    gpa_requirement = scrapy.Field()
    language_requirements = scrapy.Field()
    
    # Application details
    application_url = scrapy.Field(output_processor=TakeFirst())
    requirements = scrapy.Field(
        input_processor=MapCompose(remove_tags, str.strip),
        output_processor=Join(' ')
    )
    benefits = scrapy.Field(
        input_processor=MapCompose(remove_tags, str.strip),
        output_processor=Join(' ')
    )
    selection_criteria = scrapy.Field(
        input_processor=MapCompose(remove_tags, str.strip),
        output_processor=Join(' ')
    )
    application_process = scrapy.Field(
        input_processor=MapCompose(remove_tags, str.strip),
        output_processor=Join(' ')
    )
    
    # Provider information
    provider_name = scrapy.Field(output_processor=TakeFirst())
    provider_website = scrapy.Field(output_processor=TakeFirst())
    provider_description = scrapy.Field(
        input_processor=MapCompose(remove_tags, str.strip),
        output_processor=Join(' ')
    )
    provider_logo = scrapy.Field(output_processor=TakeFirst())
```

### 3. **EXAMPLE SPIDER IMPLEMENTATION**

```python
# scrapers/spiders/scholarships_com.py
import re
from typing import Generator
from scrapy.http import Response
from ..base.spider import BaseScholarshipSpider
from ..base.items import ScholarshipItem

class ScholarshipsComSpider(BaseScholarshipSpider):
    name = 'scholarships_com'
    source_name = 'Scholarships.com'
    allowed_domains = ['scholarships.com']
    start_urls = [
        'https://www.scholarships.com/financial-aid/college-scholarships/scholarships-by-type/',
        'https://www.scholarships.com/financial-aid/college-scholarships/scholarships-by-state/',
        'https://www.scholarships.com/financial-aid/college-scholarships/scholarships-by-major/',
    ]
    
    def parse(self, response: Response) -> Generator:
        """Parse category pages to find scholarship listings"""
        
        # Extract scholarship URLs from listing pages
        scholarship_urls = response.css('.scholarship-item a::attr(href)').getall()
        
        for url in scholarship_urls:
            yield response.follow(url, self.parse_scholarship)
            
        # Follow pagination
        next_page = response.css('.pagination .next::attr(href)').get()
        if next_page:
            yield response.follow(next_page, self.parse)
            
    def parse_scholarship(self, response: Response) -> Generator:
        """Parse individual scholarship page"""
        try:
            item = ScholarshipItem()
            
            # Basic information
            item['source_name'] = self.source_name
            item['source_url'] = response.url
            item['title'] = self.extract_title(response)
            item['description'] = self.extract_description(response)
            item['amount'] = self.extract_amount(response)
            item['deadline'] = self.extract_deadline(response)
            item['application_url'] = self.extract_application_url(response)
            
            # Eligibility criteria
            item['level'] = self.extract_level(response)
            item['fields_of_study'] = self.extract_fields(response)
            item['countries'] = self.extract_countries(response)
            item['gpa_requirement'] = self.extract_gpa(response)
            
            # Additional details
            item['requirements'] = self.extract_requirements(response)
            item['benefits'] = self.extract_benefits(response)
            item['provider_name'] = self.extract_provider_name(response)
            item['provider_website'] = self.extract_provider_website(response)
            
            yield item
            
        except Exception as e:
            self.logger.error(f"Error parsing {response.url}: {str(e)}")
            
    def extract_title(self, response: Response) -> str:
        return response.css('h1.scholarship-title::text').get() or ''
        
    def extract_description(self, response: Response) -> str:
        description_parts = response.css('.scholarship-description p::text').getall()
        return ' '.join(description_parts) if description_parts else ''
        
    def extract_amount(self, response: Response) -> dict:
        amount_text = response.css('.award-amount::text').get() or ''
        
        # Parse amount using regex
        amount_match = re.search(r'\$?([\d,]+)', amount_text.replace(',', ''))
        if amount_match:
            return {
                'value': float(amount_match.group(1)),
                'currency': 'USD',
                'raw_text': amount_text
            }
        return {'value': None, 'currency': 'USD', 'raw_text': amount_text}
        
    def extract_deadline(self, response: Response) -> str:
        deadline_text = response.css('.deadline-info::text').get() or ''
        # Use date parser utility to standardize format
        return self.cleaner.parse_date(deadline_text)
        
    def extract_level(self, response: Response) -> str:
        level_text = response.css('.education-level::text').get() or ''
        return self.cleaner.standardize_education_level(level_text)
        
    def extract_fields(self, response: Response) -> list:
        fields = response.css('.field-of-study .tag::text').getall()
        return [self.cleaner.standardize_field_name(field) for field in fields]
        
    def extract_countries(self, response: Response) -> list:
        countries = response.css('.eligible-countries .country::text').getall()
        return [self.cleaner.standardize_country_name(country) for country in countries]
        
    def extract_gpa(self, response: Response) -> float:
        gpa_text = response.css('.gpa-requirement::text').get() or ''
        gpa_match = re.search(r'(\d+\.?\d*)', gpa_text)
        return float(gpa_match.group(1)) if gpa_match else None
        
    def extract_requirements(self, response: Response) -> str:
        requirements = response.css('.requirements-section p::text').getall()
        return ' '.join(requirements) if requirements else ''
        
    def extract_benefits(self, response: Response) -> str:
        benefits = response.css('.benefits-section p::text').getall()
        return ' '.join(benefits) if benefits else ''
        
    def extract_application_url(self, response: Response) -> str:
        return response.css('.apply-button::attr(href)').get() or response.url
        
    def extract_provider_name(self, response: Response) -> str:
        return response.css('.provider-info .name::text').get() or ''
        
    def extract_provider_website(self, response: Response) -> str:
        return response.css('.provider-info .website::attr(href)').get() or ''
```

---

## DATA PROCESSING PIPELINE

### 1. **DATA VALIDATION**

```python
# scrapers/utils/validators.py
from pydantic import BaseModel, validator
from typing import Optional, List, Dict
from datetime import datetime, date

class ScholarshipValidator(BaseModel):
    title: str
    description: str
    amount: Optional[float] = None
    currency: str = "USD"
    deadline: Optional[date] = None
    application_url: str
    source_name: str
    source_url: str
    
    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v or len(v.strip()) < 5:
            raise ValueError('Title must be at least 5 characters')
        return v.strip()
        
    @validator('description')
    def description_must_not_be_empty(cls, v):
        if not v or len(v.strip()) < 20:
            raise ValueError('Description must be at least 20 characters')
        return v.strip()
        
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be positive')
        return v
        
    @validator('deadline')
    def deadline_must_be_future(cls, v):
        if v and v < datetime.now().date():
            raise ValueError('Deadline must be in the future')
        return v
        
    @validator('application_url')
    def url_must_be_valid(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v

    class Config:
        validate_assignment = True
        
    def is_valid_scholarship(self, data: Dict) -> bool:
        """Check if scholarship data is valid"""
        try:
            self.parse_obj(data)
            return True
        except Exception as e:
            return False
```

### 2. **DATA CLEANING**

```python
# scrapers/utils/cleaners.py
import re
from datetime import datetime
from typing import Optional, List, Dict
from dateutil import parser as date_parser

class DataCleaner:
    
    def __init__(self):
        self.education_level_map = {
            'high school': 'high_school',
            'undergraduate': 'bachelor',
            'graduate': 'master',
            'phd': 'doctorate',
            'doctoral': 'doctorate',
            'postdoc': 'postdoc',
        }
        
        self.country_map = {
            'USA': 'US',
            'United States': 'US',
            'UK': 'GB',
            'United Kingdom': 'GB',
            # Add more mappings
        }
        
    def clean_scholarship_data(self, item: Dict) -> Dict:
        """Clean and standardize scholarship data"""
        cleaned = {}
        
        # Clean text fields
        cleaned['title'] = self.clean_text(item.get('title', ''))
        cleaned['description'] = self.clean_text(item.get('description', ''))
        cleaned['requirements'] = self.clean_text(item.get('requirements', ''))
        
        # Parse and clean amount
        cleaned['amount'] = self.parse_amount(item.get('amount'))
        
        # Parse deadline
        cleaned['deadline'] = self.parse_date(item.get('deadline'))
        
        # Standardize education level
        cleaned['level'] = self.standardize_education_level(item.get('level'))
        
        # Clean and standardize countries
        cleaned['countries'] = self.standardize_countries(item.get('countries', []))
        
        # Clean fields of study
        cleaned['fields_of_study'] = self.standardize_fields(item.get('fields_of_study', []))
        
        return cleaned
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ''
            
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove HTML entities
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&amp;', '&')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        
        return text
        
    def parse_amount(self, amount_data) -> Optional[float]:
        """Parse scholarship amount from various formats"""
        if not amount_data:
            return None
            
        if isinstance(amount_data, dict):
            return amount_data.get('value')
            
        if isinstance(amount_data, (int, float)):
            return float(amount_data)
            
        # Parse from text
        amount_text = str(amount_data).replace(',', '').replace('$', '')
        amount_match = re.search(r'(\d+(?:\.\d{2})?)', amount_text)
        
        if amount_match:
            return float(amount_match.group(1))
            
        return None
        
    def parse_date(self, date_text: str) -> Optional[str]:
        """Parse date from various formats"""
        if not date_text:
            return None
            
        try:
            # Try to parse with dateutil
            parsed_date = date_parser.parse(date_text, fuzzy=True)
            return parsed_date.date().isoformat()
        except:
            return None
            
    def standardize_education_level(self, level: str) -> Optional[str]:
        """Standardize education level"""
        if not level:
            return None
            
        level_lower = level.lower().strip()
        
        for key, value in self.education_level_map.items():
            if key in level_lower:
                return value
                
        return None
        
    def standardize_countries(self, countries: List[str]) -> List[str]:
        """Standardize country names to ISO codes"""
        if not countries:
            return []
            
        standardized = []
        for country in countries:
            if not country:
                continue
                
            # Check if it's already a country code
            if len(country) == 2 and country.isupper():
                standardized.append(country)
                continue
                
            # Look up in mapping
            mapped = self.country_map.get(country.strip())
            if mapped:
                standardized.append(mapped)
            else:
                # Keep original if no mapping found
                standardized.append(country.strip())
                
        return list(set(standardized))  # Remove duplicates
        
    def standardize_fields(self, fields: List[str]) -> List[str]:
        """Standardize field of study names"""
        if not fields:
            return []
            
        standardized = []
        for field in fields:
            if not field:
                continue
                
            # Clean and normalize
            cleaned = self.clean_text(field)
            if cleaned:
                standardized.append(cleaned)
                
        return list(set(standardized))  # Remove duplicates
```

---

## TASK SCHEDULING

### **PLANNED CELERY CONFIGURATION**

```python
# tasks/scheduler.py
from celery import Celery
from celery.schedules import crontab
from ..scrapers.spiders.scholarships_com import ScholarshipsComSpider
from ..scrapers.spiders.fastweb_com import FastwebComSpider
from ..api.client import LaravelAPIClient
import logging

app = Celery('scholarship_scrapers')
app.config_from_object('config.celery')

@app.task(bind=True, max_retries=3)
def run_spider(self, spider_name: str):
    """Run a specific spider"""
    try:
        from scrapy.crawler import CrawlerProcess
        from scrapy.utils.project import get_project_settings
        
        settings = get_project_settings()
        process = CrawlerProcess(settings)
        
        # Get spider class by name
        spider_classes = {
            'scholarships_com': ScholarshipsComSpider,
            'fastweb_com': FastwebComSpider,
        }
        
        spider_class = spider_classes.get(spider_name)
        if not spider_class:
            raise ValueError(f"Unknown spider: {spider_name}")
            
        process.crawl(spider_class)
        process.start()
        
        logging.info(f"Spider {spider_name} completed successfully")
        
    except Exception as e:
        logging.error(f"Spider {spider_name} failed: {str(e)}")
        self.retry(countdown=60 * (self.request.retries + 1))

@app.task
def health_check():
    """Perform system health check"""
    try:
        # Check database connection
        from database.connection import get_db_connection
        db = get_db_connection()
        db.execute("SELECT 1")
        
        # Check Redis connection
        from redis import Redis
        redis_client = Redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        
        # Check Laravel API
        api_client = LaravelAPIClient()
        api_client.health_check()
        
        logging.info("Health check passed")
        return {"status": "healthy"}
        
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}

@app.task
def cleanup_old_data():
    """Clean up old scraped data"""
    try:
        from database.repositories import ScrapingLogRepository
        
        repo = ScrapingLogRepository()
        deleted_count = repo.delete_old_logs(days=30)
        
        logging.info(f"Cleaned up {deleted_count} old log entries")
        return {"deleted_count": deleted_count}
        
    except Exception as e:
        logging.error(f"Cleanup failed: {str(e)}")
        raise

# Periodic tasks schedule
app.conf.beat_schedule = {
    # Run scholarships.com spider daily at 3 AM
    'scrape-scholarships-com': {
        'task': 'tasks.scheduler.run_spider',
        'schedule': crontab(hour=3, minute=0),
        'args': ['scholarships_com']
    },
    
    # Run Fastweb spider daily at 4 AM
    'scrape-fastweb': {
        'task': 'tasks.scheduler.run_spider',
        'schedule': crontab(hour=4, minute=0),
        'args': ['fastweb_com']
    },
    
    # Health check every 5 minutes
    'health-check': {
        'task': 'tasks.scheduler.health_check',
        'schedule': crontab(minute='*/5'),
    },
    
    # Weekly cleanup on Sundays at 2 AM
    'cleanup-data': {
        'task': 'tasks.scheduler.cleanup_old_data',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),
    },
}
```

---

## INTEGRATION WITH LARAVEL

### **PLANNED WEBHOOK CLIENT**

```python
# api/client.py
import requests
import json
import logging
from typing import Dict, List
from config.settings import LARAVEL_API_URL, LARAVEL_API_KEY

class LaravelAPIClient:
    
    def __init__(self):
        self.base_url = LARAVEL_API_URL
        self.headers = {
            'Authorization': f'Bearer {LARAVEL_API_KEY}',
            'Content-Type': 'application/json',
            'User-Agent': 'ScholarshipScraper/1.0'
        }
        
    def send_scraped_data(self, spider_name: str, data: List[Dict]) -> Dict:
        """Send scraped scholarship data to Laravel"""
        payload = {
            'source': spider_name,
            'scholarships': data,
            'scraped_at': datetime.now().isoformat(),
            'scraper_version': '1.0'
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/webhooks/scraper',
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            logging.info(f"Successfully sent {len(data)} scholarships to Laravel")
            return result
            
        except requests.RequestException as e:
            logging.error(f"Failed to send data to Laravel: {str(e)}")
            raise
            
    def notify_scraping_complete(self, spider_name: str, stats: Dict) -> Dict:
        """Notify Laravel that scraping is complete"""
        payload = {
            'source': spider_name,
            'status': 'completed',
            'statistics': stats,
            'completed_at': datetime.now().isoformat()
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/webhooks/scraper/complete',
                headers=self.headers,
                json=payload,
                timeout=15
            )
            response.raise_for_status()
            
            return response.json()
            
        except requests.RequestException as e:
            logging.error(f"Failed to notify Laravel: {str(e)}")
            raise
            
    def health_check(self) -> bool:
        """Check if Laravel API is accessible"""
        try:
            response = requests.get(
                f'{self.base_url}/health',
                headers=self.headers,
                timeout=10
            )
            return response.status_code == 200
            
        except requests.RequestException:
            return False
```

---

## DEPLOYMENT & MONITORING

### **DOCKER CONFIGURATION**

```dockerfile
# docker/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libxml2-dev \
    libxslt-dev \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 scraper
RUN chown -R scraper:scraper /app
USER scraper

# Default command
CMD ["celery", "worker", "-A", "tasks.scheduler", "--loglevel=info"]
```

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: scholarship_scraper
      POSTGRES_USER: scraper
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  celery_worker:
    build: .
    command: celery worker -A tasks.scheduler --loglevel=info --concurrency=4
    volumes:
      - .:/app
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://scraper:password@postgres:5432/scholarship_scraper
    depends_on:
      - redis
      - postgres

  celery_beat:
    build: .
    command: celery beat -A tasks.scheduler --loglevel=info
    volumes:
      - .:/app
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://scraper:password@postgres:5432/scholarship_scraper
    depends_on:
      - redis
      - postgres

  flower:
    build: .
    command: celery flower -A tasks.scheduler --port=5555
    ports:
      - "5555:5555"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis

volumes:
  redis_data:
  postgres_data:
```

---

## MONITORING & ALERTING

### **PROMETHEUS METRICS**

```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Metrics
scraped_scholarships_total = Counter(
    'scraped_scholarships_total',
    'Total number of scholarships scraped',
    ['spider', 'status']
)

scraping_duration_seconds = Histogram(
    'scraping_duration_seconds',
    'Time spent scraping',
    ['spider']
)

active_spiders = Gauge(
    'active_spiders',
    'Number of currently running spiders'
)

data_quality_score = Gauge(
    'data_quality_score',
    'Data quality score (0-1)',  
    ['spider']
)

class ScrapingMetrics:
    
    def __init__(self):
        self.start_time = None
        
    def start_scraping(self, spider_name: str):
        """Mark start of scraping"""
        self.start_time = time.time()
        active_spiders.inc()
        
    def record_scholarship(self, spider_name: str, status: str = 'success'):
        """Record a scraped scholarship"""
        scraped_scholarships_total.labels(
            spider=spider_name,
            status=status
        ).inc()
        
    def finish_scraping(self, spider_name: str):
        """Mark end of scraping"""
        if self.start_time:
            duration = time.time() - self.start_time
            scraping_duration_seconds.labels(spider=spider_name).observe(duration)
            
        active_spiders.dec()
        
    def record_quality_score(self, spider_name: str, score: float):
        """Record data quality score"""
        data_quality_score.labels(spider=spider_name).set(score)

# Start Prometheus metrics server
def start_metrics_server(port: int = 8000):
    start_http_server(port)
```

This planned architecture provides a reference foundation for a future external connector phase while preserving current production focus on curated and mock-assisted datasets.