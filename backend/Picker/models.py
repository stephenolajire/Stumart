from django.db import models
from User.models import User

# Create your models here.
class PickerWallet (models.Model):
    amount = models.CharField(max_length=100, null=True, blank=True)
    picker = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.picker.username} - {self.amount}"