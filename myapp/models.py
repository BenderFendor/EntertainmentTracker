from django.db import models

# TODO: Add proper user authentication and link WatchlistItem to User model
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
    
    user = models.CharField(max_length=100)
    media_id = models.CharField(max_length=100)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES)
    title = models.CharField(max_length=255)
    poster_path = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    progress = models.IntegerField(default=0)  # Episode/chapter number
    total_episodes = models.IntegerField(null=True, blank=True)
    added_date = models.DateTimeField(auto_now_add=True)