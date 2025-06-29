using api.Models;

namespace api.Services;

public interface IAuthService
{
    Task<string> GenerateJwtToken(User user);
    Task<User?> ValidateUser(string email, string password);
    Task<User> CreateUser(string email, string password, string timezone = "UTC");
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}
