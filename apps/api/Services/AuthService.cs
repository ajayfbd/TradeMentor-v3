using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TradeMentor.Api.Data;
using TradeMentor.Api.Models;
using TradeMentor.Api.Data.Repositories;
using TradeMentor.Api.Validation;
using Microsoft.EntityFrameworkCore;

namespace TradeMentor.Api.Services;

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<UserDto>> RegisterAsync(RegisterRequest request);
    Task<ApiResponse<LoginResponse>> RefreshTokenAsync(string refreshToken);
    Task<ApiResponse> LogoutAsync(string userId);
    string GenerateJwtToken(User user);
    string GenerateRefreshToken();
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
            {
                return ApiResponse<LoginResponse>.ErrorResponse("Invalid email or password");
            }

            // SECURITY FIX: Enable password verification
            if (string.IsNullOrEmpty(user.PasswordHash) || !VerifyPassword(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Failed password verification for user: {UserId}", user.Id);
                return ApiResponse<LoginResponse>.ErrorResponse("Invalid email or password");
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            var response = new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    StreakCount = user.StreakCount,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                }
            };

            return ApiResponse<LoginResponse>.SuccessResponse(response, "Login successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user {Email}", request.Email);
            return ApiResponse<LoginResponse>.ErrorResponse("An error occurred during login");
        }
    }

    public async Task<ApiResponse<UserDto>> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Enhanced input validation
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return ApiResponse<UserDto>.ErrorResponse("Email and password are required");
            }

            // Email validation
            if (!IsValidEmail(request.Email))
            {
                return ApiResponse<UserDto>.ErrorResponse("Invalid email format");
            }

            // Password validation
            if (!IsValidPassword(request.Password))
            {
                return ApiResponse<UserDto>.ErrorResponse(
                    "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character");
            }

            if (await _userRepository.EmailExistsAsync(request.Email))
            {
                return ApiResponse<UserDto>.ErrorResponse("Email already exists");
            }

            var user = new User
            {
                Email = request.Email.ToLower().Trim(),
                FirstName = request.FirstName,
                LastName = request.LastName,
                UserName = request.Email,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                PasswordHash = HashPassword(request.Password) // SECURITY FIX: Enable password hashing
            };

            await _userRepository.AddAsync(user);

            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                StreakCount = user.StreakCount,
                CreatedAt = user.CreatedAt
            };

            _logger.LogInformation("New user registered: {UserId}", user.Id);

            return ApiResponse<UserDto>.SuccessResponse(userDto, "Registration successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for user {Email}", request.Email);
            return ApiResponse<UserDto>.ErrorResponse("An error occurred during registration");
        }
    }

    public async Task<ApiResponse<LoginResponse>> RefreshTokenAsync(string refreshToken)
    {
        await Task.CompletedTask;
        return ApiResponse<LoginResponse>.ErrorResponse("Refresh token not implemented yet");
    }

    public async Task<ApiResponse> LogoutAsync(string userId)
    {
        await Task.CompletedTask;
        return ApiResponse.SuccessResponse("Logout successful");
    }

    public string GenerateJwtToken(User user)
    {
        var jwtSecret = _configuration["Jwt:Secret"] ?? 
            Environment.GetEnvironmentVariable("JWT_SECRET") ?? 
            "your-super-secret-key-change-this-in-production-make-it-256-bit";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
            new Claim("userId", user.Id),
            new Claim("streakCount", user.StreakCount.ToString()),
            new Claim("timezone", user.Timezone)
        };

        var token = new JwtSecurityToken(
            issuer: null, // Remove issuer requirement
            audience: null, // Remove audience requirement
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString();
    }

    public string HashPassword(string password)
    {
        // Use BCrypt with work factor of 12 for security
        return BCrypt.Net.BCrypt.HashPassword(password, 12);
    }

    public bool VerifyPassword(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying password");
            return false;
        }
    }

    private bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254)
            return false;
        
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private bool IsValidPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            return false;

        // Password requirements:
        // - At least 8 characters
        // - At least one uppercase letter
        // - At least one lowercase letter
        // - At least one digit
        // - At least one special character
        if (password.Length < 8 || password.Length > 128)
            return false;

        bool hasUpper = password.Any(char.IsUpper);
        bool hasLower = password.Any(char.IsLower);
        bool hasDigit = password.Any(char.IsDigit);
        bool hasSpecial = password.Any(ch => !char.IsLetterOrDigit(ch));

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}
