using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TradeMentor.Api.Models;
using TradeMentor.Api.Services;

namespace TradeMentor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<object>>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Invalid request data"));
            }

            var result = await _authService.RegisterAsync(request);
            
            if (result.Success)
            {
                _logger.LogInformation("User registered successfully: {Email}", request.Email);
                return Ok(result);
            }

            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user: {Email}", request.Email);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Registration failed"));
        }
    }

    /// <summary>
    /// Login user
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse("Invalid request data"));
            }

            var result = await _authService.LoginAsync(request);
            
            if (result.Success)
            {
                _logger.LogInformation("User logged in successfully: {Email}", request.Email);
                return Ok(result);
            }

            return Unauthorized(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging in user: {Email}", request.Email);
            return StatusCode(500, ApiResponse<LoginResponse>.ErrorResponse("Login failed"));
        }
    }

    /// <summary>
    /// Logout user
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public ActionResult<ApiResponse<object>> Logout()
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            _logger.LogInformation("User logged out: {UserId}", userId);
            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Logged out successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging out user");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Logout failed"));
        }
    }
}
