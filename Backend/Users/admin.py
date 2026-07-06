from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, Language, SocialAuth


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'native_name')
    search_fields = ('code', 'name')
    ordering = ('name',)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'is_verified', 'is_staff', 'created_at')
    list_filter = ('is_active', 'is_verified', 'is_staff', 'language')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_login_at')

    fieldsets = (
        ('Credentials',  {'fields': ('id', 'email', 'password')}),
        ('Profile',      {'fields': ('first_name', 'last_name', 'avatar_url', 'country_code', 'language')}),
        ('Permissions',  {'fields': ('is_active', 'is_verified', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps',   {'fields': ('created_at', 'updated_at', 'last_login_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    # Django's UserAdmin uses 'username' by default — override for email auth
    filter_horizontal = ('groups', 'user_permissions')


@admin.register(SocialAuth)
class SocialAuthAdmin(admin.ModelAdmin):
    list_display = ('user', 'provider', 'provider_uid', 'created_at')
    list_filter = ('provider',)
    search_fields = ('user__email', 'provider_uid')
    readonly_fields = ('id', 'created_at')
