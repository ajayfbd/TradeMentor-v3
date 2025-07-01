using System.Text.RegularExpressions;
using System.Web;

namespace TradeMentor.Api.Validation;

public static class InputValidator
{
    private static readonly Regex EmailRegex = new(
        @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex SafeTextRegex = new(
        @"^[a-zA-Z0-9\s\-_.,!?()]+$",
        RegexOptions.Compiled);

    public static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254)
            return false;
        
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email && EmailRegex.IsMatch(email);
        }
        catch
        {
            return false;
        }
    }

    public static bool IsValidPassword(string password)
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

    public static string SanitizeInput(string input, int maxLength = 1000)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Remove potentially dangerous characters
        input = input.Trim();
        
        // Truncate if too long
        if (input.Length > maxLength)
            input = input.Substring(0, maxLength);

        // Basic HTML encoding for XSS prevention
        input = HttpUtility.HtmlEncode(input);

        return input;
    }

    public static bool IsValidSymbol(string symbol)
    {
        if (string.IsNullOrWhiteSpace(symbol))
            return false;

        // Stock symbols: 2-10 characters, letters and digits only
        return symbol.Length >= 2 && symbol.Length <= 10 && 
               symbol.All(c => char.IsLetterOrDigit(c));
    }

    public static bool IsValidEmotionLevel(int level)
    {
        return level >= 1 && level <= 10;
    }

    public static bool IsValidEmotionContext(string context)
    {
        var validContexts = new[] { "pre-trade", "post-trade", "market-event" };
        return !string.IsNullOrWhiteSpace(context) && 
               validContexts.Contains(context.ToLower());
    }

    public static bool IsValidText(string text, int maxLength = 1000)
    {
        if (string.IsNullOrEmpty(text))
            return true; // Allow empty text

        if (text.Length > maxLength)
            return false;

        // Check for basic text safety (no malicious scripts, etc.)
        // Allow most characters for rich text content
        return !text.Contains("<script", StringComparison.OrdinalIgnoreCase) &&
               !text.Contains("javascript:", StringComparison.OrdinalIgnoreCase) &&
               !text.Contains("onload=", StringComparison.OrdinalIgnoreCase) &&
               !text.Contains("onerror=", StringComparison.OrdinalIgnoreCase);
    }
}
