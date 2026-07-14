from django.db import models

class Admin(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    username = models.CharField(unique=True, max_length=100)
    email = models.CharField(unique=True, max_length=255)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(db_column='createdAt', auto_now_add=True, null=True, blank=True)

    class Meta:
        db_table = 'admins'

    def __str__(self):
        return self.username


class DiocesanAccount(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    denary = models.CharField(unique=True, max_length=100)
    diocese_name = models.CharField(db_column='dioceseName', max_length=255)
    account_holder_name = models.CharField(db_column='accountHolderName', max_length=255)
    account_number = models.CharField(db_column='accountNumber', max_length=50)
    bank_name = models.CharField(db_column='bankName', max_length=100)
    swift_code = models.CharField(db_column='swiftCode', max_length=50, blank=True, null=True)
    routing_number = models.CharField(db_column='routingNumber', max_length=50, blank=True, null=True)
    currency = models.CharField(max_length=10, default='USD', blank=True, null=True)
    is_active = models.BooleanField(db_column='isActive', default=True, blank=True, null=True)
    created_at = models.DateTimeField(db_column='createdAt', auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(db_column='updatedAt', auto_now=True, null=True, blank=True)
    sort_code = models.CharField(db_column='sortCode', max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'diocesan_accounts'

    def __str__(self):
        return f"{self.diocese_name} - {self.denary}"


class Registration(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    denary = models.CharField(max_length=100)
    parish = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField(max_length=255)
    address = models.TextField()
    occupation = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='pending', blank=True, null=True)
    submitted_at = models.DateTimeField(db_column='submittedAt', auto_now_add=True, null=True, blank=True)

    class Meta:
        db_table = 'registrations'

    def __str__(self):
        return self.name


class Payment(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    registration = models.ForeignKey(Registration, on_delete=models.SET_NULL, db_column='registrationId', blank=True, null=True)
    amount = models.FloatField()
    currency = models.CharField(max_length=10, default='USD', blank=True, null=True)
    payment_method = models.CharField(db_column='paymentMethod', max_length=50)
    card_last_four = models.CharField(db_column='cardLastFour', max_length=10, blank=True, null=True)
    cardholder_name = models.CharField(db_column='cardholderName', max_length=255, blank=True, null=True)
    email = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='completed', blank=True, null=True)
    transaction_id = models.CharField(db_column='transactionId', max_length=100, blank=True, null=True)
    paid_at = models.DateTimeField(db_column='paidAt', auto_now_add=True, null=True, blank=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f"{self.email} - {self.transaction_id}"


class Event(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    denary = models.CharField(max_length=100)
    parish = models.CharField(max_length=255, blank=True, null=True)
    event_date = models.DateTimeField()
    uploaded_by = models.ForeignKey(Admin, on_delete=models.SET_NULL, db_column='uploaded_by', blank=True, null=True)
    venue = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        db_table = 'events'

    def __str__(self):
        return self.title


class EventMedia(models.Model):
    id = models.AutoField(primary_key=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, db_column='event_id', related_name='media')
    filename = models.CharField(max_length=255)
    original_name = models.CharField(db_column='original_name', max_length=255)
    mime_type = models.CharField(db_column='mime_type', max_length=100)
    file_path = models.CharField(db_column='file_path', max_length=255)
    file_size = models.IntegerField(db_column='file_size')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        db_table = 'event_media'

    def __str__(self):
        return self.original_name


class Leader(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    year = models.IntegerField()
    achievement = models.TextField()
    photo_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        db_table = 'leaders'

    def __str__(self):
        return self.name
