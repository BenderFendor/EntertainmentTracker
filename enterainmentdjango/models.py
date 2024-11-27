from django.db import models

class WatchlistItem(models.Model):
    STATUS_CHOICES = [
        ('watching', 'Currently Watching'),
        ('plan_to_watch', 'Plan to Watch'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped')
    ]
    
    MEDIA_TYPES = [
        ('movie', 'Movie'),
        ('tv', 'TV Show'),
        ('anime', 'Anime'),
        ('manga', 'Manga'),
        ('book', 'Book')
    ]
    
    # Required fields
    user = models.CharField(max_length=100)
    media_id = models.CharField(max_length=100)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    # Optional fields
    poster_path = models.CharField(max_length=255, null=True, blank=True)
    progress = models.IntegerField(default=0)
    total_episodes = models.IntegerField(null=True, blank=True)
    genres = models.JSONField(default=list, blank=True)
    creator = models.CharField(max_length=255, default='Unknown')
    year = models.CharField(max_length=4, blank=True)
    rating = models.IntegerField(default=0)
    
    # Timestamps
    date_added = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'media_id']