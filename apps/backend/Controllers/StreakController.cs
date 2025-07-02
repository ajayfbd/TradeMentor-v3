using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TradeMentor.Services;
using System.Security.Claims;

namespace TradeMentor.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StreakController : ControllerBase
    {
        private readonly StreakService _streakService;
        
        public StreakController(StreakService streakService)
        {
            _streakService = streakService;
        }
        
        [HttpGet]
        public async Task<IActionResult> GetUserStreak()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Invalid user ID");
                }
                
                var streakData = await _streakService.GetUserStreakAsync(userId);
                return Ok(streakData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving streak data", error = ex.Message });
            }
        }
        
        [HttpPost("update")]
        public async Task<IActionResult> UpdateStreak()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Invalid user ID");
                }
                
                var streakUpdate = await _streakService.UpdateStreakAsync(userId);
                return Ok(streakUpdate);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating streak", error = ex.Message });
            }
        }
    }
}
