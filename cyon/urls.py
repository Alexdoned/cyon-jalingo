from django.urls import path
from . import views

urlpatterns = [
    # Public pages
    path('',                      views.home_view,             name='home'),
    path('leaders',               views.leaders_view,          name='leaders'),
    path('events',                views.events_view,           name='events'),
    path('register',              views.register_view,         name='register'),
    path('payment',               views.payment_view,          name='payment'),
    path('payment-success',       views.payment_success_view,  name='payment_success'),

    # Media serving (legacy-compatible)
    path('api/events/media/<str:filename>',  views.serve_event_media,   name='event_media'),
    path('api/leaders/photo/<str:filename>', views.serve_leader_photo,  name='leader_photo'),

    # Admin auth
    path('admin-login',           views.admin_login_view,      name='admin_login'),
    path('admin-logout',          views.admin_logout_view,     name='admin_logout'),

    # Admin dashboard
    path('admin-dashboard',                                     views.admin_dashboard_view,     name='admin_dashboard'),
    path('admin-dashboard/leader/save',                         views.leader_save_view,         name='leader_save'),
    path('admin-dashboard/leader/<int:leader_id>/delete',       views.leader_delete_view,       name='leader_delete'),
    path('admin-dashboard/event/save',                          views.event_save_view,          name='event_save'),
    path('admin-dashboard/event/<int:event_id>/delete',         views.event_delete_view,        name='event_delete'),
    path('admin-dashboard/registration/<str:reg_id>/status',    views.registration_status_view, name='registration_status'),
    path('admin-dashboard/registration/<str:reg_id>/delete',    views.registration_delete_view, name='registration_delete'),
    path('admin-change-password',                               views.change_password_view,     name='change_password'),
]
