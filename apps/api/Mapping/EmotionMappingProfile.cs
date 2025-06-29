using AutoMapper;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Mapping;

public class EmotionMappingProfile : Profile
{
    public EmotionMappingProfile()
    {
        // EmotionCheck to EmotionResponseDto
        CreateMap<EmotionCheck, EmotionResponseDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId));

        // EmotionCheckDto to EmotionCheck
        CreateMap<EmotionCheckDto, EmotionCheck>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => 
                src.Timestamp ?? DateTime.UtcNow));
    }
}
