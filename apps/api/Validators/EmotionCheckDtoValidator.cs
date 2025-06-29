using FluentValidation;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Validators;

public class EmotionCheckDtoValidator : AbstractValidator<EmotionCheckDto>
{
    public EmotionCheckDtoValidator()
    {
        RuleFor(x => x.Level)
            .InclusiveBetween(1, 10)
            .WithMessage("Emotion level must be between 1 and 10");

        RuleFor(x => x.Context)
            .NotEmpty()
            .WithMessage("Context is required")
            .Must(BeValidContext)
            .WithMessage("Context must be one of: pre-trade, post-trade, market-event");

        RuleFor(x => x.Symbol)
            .MaximumLength(10)
            .WithMessage("Symbol must not exceed 10 characters")
            .Matches(@"^[A-Z0-9]*$")
            .When(x => !string.IsNullOrEmpty(x.Symbol))
            .WithMessage("Symbol must contain only uppercase letters and numbers");

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .WithMessage("Notes must not exceed 1000 characters");

        RuleFor(x => x.Timestamp)
            .LessThanOrEqualTo(DateTime.UtcNow.AddMinutes(5))
            .When(x => x.Timestamp.HasValue)
            .WithMessage("Timestamp cannot be in the future");
    }

    private static bool BeValidContext(string context)
    {
        var validContexts = new[] { "pre-trade", "post-trade", "market-event" };
        return validContexts.Contains(context.ToLower());
    }
}
