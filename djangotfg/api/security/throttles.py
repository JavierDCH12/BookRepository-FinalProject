from rest_framework.throttling import SimpleRateThrottle

 # Clases para limitar el número de peticiones por segundo

class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'
    def get_cache_key(self, request, view):
        return self.get_ident(request)


class RegisterRateThrottle(SimpleRateThrottle):
    scope = 'register'
    def get_cache_key(self, request, view):
        return self.get_ident(request)

class FavoriteRateThrottle(SimpleRateThrottle):
    scope = 'favorites'
    def get_cache_key(self, request, view):
        return self.get_ident(request)

class ProfileUpdateRateThrottle(SimpleRateThrottle):
    scope = 'profile_update'
    def get_cache_key(self, request, view):
        return self.get_ident(request)