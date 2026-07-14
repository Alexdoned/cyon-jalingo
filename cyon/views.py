import os
import uuid
import json
import random
import string
import mimetypes
from pathlib import Path

import bcrypt
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse, Http404, FileResponse
from django.contrib import messages
from django.conf import settings

from .models import Admin, Registration, Payment, Event, EventMedia, Leader, DiocesanAccount

# ---------------------------------------------------------------------------
# Denary / Parish data (mirrors the legacy React utils)
# ---------------------------------------------------------------------------
DENARY_PARISH_MAP = {
    "bali":       ["St. Oliver Maihula", "St. Paul Bali", "St. Mary Jatau"],
    "kofai":      ["St. Peter Nukkai", "Holy Family Kofai", "St Athanasius Iware",
                   "St. John the Baptist Janebanbu", "St. Thomas Aquinas Chaplaincy",
                   "St. Gabriel Sunkani", "St.Peter chaplaincy Jauro Yino"],
    "jalingo":    ["St. Joseph Mayo-gwoi", "Holy Trinity Nyabunkaka", "St. Paul Sabongari",
                   "St. Paul Tutunwada", "St. Augustine Jalingo", "St. Theresa NTA"],
    "zing":       ["St. Thomas", "St. Patrick Tudun wada", "St. Stephen Bitako Yali Pastoral",
                   "St. Mary Bitako Mazara pastoral", "St. Andrew Gampubong Pastoral"],
    "kpantisawa": ["St. John Parish Kpantisawa", "St. Peter Pupule",
                   "St. Theresa Mika pastoral", "St. Thesesa of the child Jesus"],
    "yakoko":     ["St. Monica's yakoko", "All Saints Lamma", "St. Peter Monkin"],
    "olqp":       ["St Patrick kpanti Napoo", "Our lady queen of peace cathedral",
                   "St Ann negatavah", "Pastoral Area", "St Peter Abuja phase 1",
                   "St Justina mayo Dassa", "St John Paul de second gulom",
                   "Church of Assumption Kona"],
    "mutumbiyu":  ["St John Mutum-biyu", "St Paul Tella", "St Parick Sabongida",
                   "St Monica Namnail", "St Denis Pena", "St Mathew Dan", "St Peter Dinya"],
    "karimlamido":["St Joseph Lau", "Holy Family Karim Lamido", "St Patrick Jen Pastoral area",
                   "St Theresa Kunini", "St John Bosko Chaplaincy Jimlari"],
}


# ---------------------------------------------------------------------------
# Helper decorator – require admin session
# ---------------------------------------------------------------------------
def admin_required(view_func):
    def wrapped(request, *args, **kwargs):
        if not request.session.get('admin_id'):
            messages.error(request, 'Please log in to access the admin dashboard.')
            return redirect('/admin-login')
        return view_func(request, *args, **kwargs)
    wrapped.__name__ = view_func.__name__
    return wrapped


# ---------------------------------------------------------------------------
# Public views
# ---------------------------------------------------------------------------
def home_view(request):
    events = Event.objects.prefetch_related('media').order_by('-created_at')[:3]
    event_list = []
    for ev in events:
        first_media = ev.media.first()
        event_list.append({'event': ev, 'first_media': first_media})
    return render(request, 'cyon/home.html', {
        'events': event_list,
        'denary_parish_map': DENARY_PARISH_MAP,
    })


def leaders_view(request):
    leaders = Leader.objects.order_by('-year', '-created_at')
    return render(request, 'cyon/leaders.html', {'leaders': leaders})


def events_view(request):
    denary_filter = request.GET.get('denary', '').strip()
    qs = Event.objects.prefetch_related('media').order_by('-created_at')
    if denary_filter:
        qs = qs.filter(denary__iexact=denary_filter)
    return render(request, 'cyon/events.html', {
        'events': qs,
        'denary_filter': denary_filter,
    })


def register_view(request):
    if request.method == 'POST':
        name       = request.POST.get('name', '').strip()
        email      = request.POST.get('email', '').strip().lower()
        phone      = request.POST.get('phone', '').strip()
        address    = request.POST.get('address', '').strip()
        occupation = request.POST.get('occupation', '').strip()
        denary     = request.POST.get('denary', '').strip()
        parish     = request.POST.get('parish', '').strip()

        form_data = dict(name=name, email=email, phone=phone,
                         address=address, occupation=occupation,
                         denary=denary, parish=parish)

        if not all([name, email, phone, address, occupation, denary, parish]):
            messages.error(request, 'Please complete all fields.')
            return render(request, 'cyon/register.html', {
                'denaries': list(DENARY_PARISH_MAP.keys()),
                'denary_parish_map_json': json.dumps(DENARY_PARISH_MAP),
                'form_data': form_data,
            })

        reg = Registration.objects.create(
            id=str(uuid.uuid4()),
            name=name, email=email, phone=phone,
            address=address, occupation=occupation,
            denary=denary, parish=parish, status='pending',
        )
        return redirect(f'/payment?id={reg.id}')

    return render(request, 'cyon/register.html', {
        'denaries': list(DENARY_PARISH_MAP.keys()),
        'denary_parish_map_json': json.dumps(DENARY_PARISH_MAP),
        'form_data': {},
    })


def payment_view(request):
    registration_id = request.GET.get('id') or request.POST.get('registration_id')
    registration = None
    if registration_id:
        try:
            registration = Registration.objects.get(id=registration_id)
        except Registration.DoesNotExist:
            pass

    if request.method == 'POST':
        payment_method  = request.POST.get('payment_method', 'card')
        card_number     = request.POST.get('card_number', '').replace(' ', '')
        expiry_date     = request.POST.get('expiry_date', '')
        cvv             = request.POST.get('cvv', '')
        cardholder_name = request.POST.get('cardholder_name', '')

        if not registration_id:
            messages.error(request, 'Missing registration. Please register first.')
            return redirect('/register')

        if not registration:
            messages.error(request, 'Registration not found.')
            return redirect('/register')

        if payment_method == 'card' and not card_number:
            messages.error(request, 'Card details are required for card payment.')
            return render(request, 'cyon/payment.html', {'registration': registration})

        card_last_four = card_number[-4:] if card_number else None
        transaction_id = 'TXN_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))

        payment = Payment.objects.create(
            id=str(uuid.uuid4()),
            registration=registration,
            amount=25.0,
            currency='USD',
            payment_method=payment_method,
            card_last_four=card_last_four,
            cardholder_name=cardholder_name or None,
            email=registration.email,
            status='completed',
            transaction_id=transaction_id,
        )
        return render(request, 'cyon/payment_success.html', {
            'payment': payment,
            'registration': registration,
        })

    return render(request, 'cyon/payment.html', {'registration': registration})


def payment_success_view(request):
    return render(request, 'cyon/payment_success.html', {})


# ---------------------------------------------------------------------------
# Serve uploaded media (legacy-compatible paths)
# ---------------------------------------------------------------------------
def serve_event_media(request, filename):
    media_dir = Path(settings.MEDIA_ROOT) / 'events'
    file_path = media_dir / filename
    if not file_path.exists():
        raise Http404("File not found")
    mime, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(open(file_path, 'rb'), content_type=mime or 'application/octet-stream')


def serve_leader_photo(request, filename):
    media_dir = Path(settings.MEDIA_ROOT) / 'leaders'
    file_path = media_dir / filename
    if not file_path.exists():
        raise Http404("File not found")
    mime, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(open(file_path, 'rb'), content_type=mime or 'application/octet-stream')


# ---------------------------------------------------------------------------
# Admin auth
# ---------------------------------------------------------------------------
def admin_login_view(request):
    if request.session.get('admin_id'):
        return redirect('/admin-dashboard')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip().lower()
        password = request.POST.get('password', '').strip()
        try:
            admin = Admin.objects.get(username=username)
            pwd_bytes = password.encode('utf-8')
            hash_bytes = admin.password.encode('utf-8')
            if bcrypt.checkpw(pwd_bytes, hash_bytes):
                request.session['admin_id'] = admin.id
                request.session['admin_username'] = admin.username
                return redirect('/admin-dashboard')
            else:
                messages.error(request, 'Invalid credentials.')
        except Admin.DoesNotExist:
            messages.error(request, 'Invalid credentials.')

    return render(request, 'cyon/admin_login.html')


def admin_logout_view(request):
    request.session.flush()
    return redirect('/admin-login')


# ---------------------------------------------------------------------------
# Admin dashboard
# ---------------------------------------------------------------------------
@admin_required
def admin_dashboard_view(request):
    registrations = Registration.objects.order_by('-submitted_at')
    leaders       = Leader.objects.order_by('-year', '-created_at')
    events        = Event.objects.order_by('-created_at')
    pending_count = registrations.filter(status='pending').count()

    return render(request, 'cyon/admin_dashboard.html', {
        'registrations': registrations,
        'leaders':       leaders,
        'events':        events,
        'pending_count': pending_count,
        'denaries':      list(DENARY_PARISH_MAP.keys()),
    })


@admin_required
def leader_save_view(request):
    if request.method != 'POST':
        return redirect('/admin-dashboard')

    leader_id   = request.POST.get('leader_id', '').strip()
    name        = request.POST.get('name', '').strip()
    year        = request.POST.get('year', '').strip()
    achievement = request.POST.get('achievement', '').strip()
    photo_url   = request.POST.get('photo_url', '').strip()
    photo_file  = request.FILES.get('photo')

    # Handle file upload
    final_photo_url = photo_url
    if photo_file:
        ext      = Path(photo_file.name).suffix
        filename = str(uuid.uuid4()) + ext
        save_dir = Path(settings.MEDIA_ROOT) / 'leaders'
        save_dir.mkdir(parents=True, exist_ok=True)
        with open(save_dir / filename, 'wb') as f:
            for chunk in photo_file.chunks():
                f.write(chunk)
        final_photo_url = filename

    if leader_id:
        leader = get_object_or_404(Leader, id=leader_id)
        leader.name        = name
        leader.year        = int(year)
        leader.achievement = achievement
        if final_photo_url:
            leader.photo_url = final_photo_url
        leader.save()
        messages.success(request, f'Leader "{name}" updated successfully.')
    else:
        Leader.objects.create(
            name=name, year=int(year),
            achievement=achievement,
            photo_url=final_photo_url or '',
        )
        messages.success(request, f'Leader "{name}" created successfully.')

    return redirect('/admin-dashboard')


@admin_required
def leader_delete_view(request, leader_id):
    if request.method == 'POST':
        leader = get_object_or_404(Leader, id=leader_id)
        name = leader.name
        leader.delete()
        messages.success(request, f'Leader "{name}" deleted.')
    return redirect('/admin-dashboard')


@admin_required
def event_save_view(request):
    if request.method != 'POST':
        return redirect('/admin-dashboard')

    event_id    = request.POST.get('event_id', '').strip()
    title       = request.POST.get('title', '').strip()
    description = request.POST.get('description', '').strip()
    denary      = request.POST.get('denary', '').strip()
    parish      = request.POST.get('parish', '').strip()
    event_date  = request.POST.get('event_date', '').strip()
    venue       = request.POST.get('venue', '').strip()
    media_files = request.FILES.getlist('media')

    admin_id = request.session.get('admin_id')
    try:
        admin = Admin.objects.get(id=admin_id)
    except Admin.DoesNotExist:
        admin = None

    if event_id:
        event = get_object_or_404(Event, id=event_id)
        event.title       = title
        event.description = description
        event.denary      = denary
        event.parish      = parish
        event.event_date  = event_date
        event.venue       = venue
        event.save()
        messages.success(request, f'Event "{title}" updated.')
    else:
        event = Event.objects.create(
            title=title, description=description,
            denary=denary, parish=parish,
            event_date=event_date, venue=venue,
            uploaded_by=admin,
        )
        messages.success(request, f'Event "{title}" created.')

    # Save uploaded media files
    if media_files:
        save_dir = Path(settings.MEDIA_ROOT) / 'events'
        save_dir.mkdir(parents=True, exist_ok=True)
        for mf in media_files:
            ext      = Path(mf.name).suffix
            filename = str(uuid.uuid4()) + ext
            with open(save_dir / filename, 'wb') as f:
                for chunk in mf.chunks():
                    f.write(chunk)
            EventMedia.objects.create(
                event=event,
                filename=filename,
                original_name=mf.name,
                mime_type=mf.content_type,
                file_path=str(save_dir / filename),
                file_size=mf.size,
            )

    return redirect('/admin-dashboard')


@admin_required
def event_delete_view(request, event_id):
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id)
        title = event.title
        # Delete associated media files
        for media in event.media.all():
            try:
                fp = Path(media.file_path)
                if fp.exists():
                    fp.unlink()
            except Exception:
                pass
        event.delete()
        messages.success(request, f'Event "{title}" deleted.')
    return redirect('/admin-dashboard')


@admin_required
def registration_status_view(request, reg_id):
    if request.method == 'POST':
        status = request.POST.get('status', '').strip()
        if status in ('approved', 'rejected', 'pending'):
            reg = get_object_or_404(Registration, id=reg_id)
            reg.status = status
            reg.save()
            messages.success(request, f'Registration {status}.')
    return redirect('/admin-dashboard')


@admin_required
def registration_delete_view(request, reg_id):
    if request.method == 'POST':
        reg = get_object_or_404(Registration, id=reg_id)
        reg.delete()
        messages.success(request, 'Registration deleted.')
    return redirect('/admin-dashboard')


@admin_required
def change_password_view(request):
    if request.method == 'POST':
        current  = request.POST.get('current_password', '').strip()
        new_pw   = request.POST.get('new_password', '').strip()
        confirm  = request.POST.get('confirm_password', '').strip()

        if new_pw != confirm:
            messages.error(request, 'New passwords do not match.')
            return redirect('/admin-dashboard')

        admin_id = request.session.get('admin_id')
        try:
            admin = Admin.objects.get(id=admin_id)
            if bcrypt.checkpw(current.encode(), admin.password.encode()):
                hashed = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt()).decode()
                admin.password = hashed
                admin.save()
                messages.success(request, 'Password changed successfully.')
            else:
                messages.error(request, 'Current password is incorrect.')
        except Admin.DoesNotExist:
            messages.error(request, 'Admin not found.')

    return redirect('/admin-dashboard')
