using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeMentor.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnhancedDatabaseSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExecutionQuality",
                table: "Trades",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SetupQuality",
                table: "Trades",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Intensity",
                table: "EmotionChecks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MarketConditions",
                table: "EmotionChecks",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryEmotion",
                table: "EmotionChecks",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SessionId",
                table: "EmotionChecks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UserInsights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    InsightType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Data = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(3,2)", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInsights", x => x.Id);
                    table.CheckConstraint("CK_UserInsight_ConfidenceScore", "\"ConfidenceScore\" >= 0.00 AND \"ConfidenceScore\" <= 10.00");
                    table.CheckConstraint("CK_UserInsight_InsightType", "\"InsightType\" IN ('performance_correlation', 'best_times', 'emotion_pattern', 'streak_milestone')");
                    table.ForeignKey(
                        name: "FK_UserInsights_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    EmotionsLogged = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TradesLogged = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    SessionQualityScore = table.Column<decimal>(type: "numeric(3,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSessions", x => x.Id);
                    table.CheckConstraint("CK_UserSession_SessionQualityScore", "\"SessionQualityScore\" >= 0.00 AND \"SessionQualityScore\" <= 10.00");
                    table.ForeignKey(
                        name: "FK_UserSessions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Trade_ExecutionQuality",
                table: "Trades",
                sql: "\"ExecutionQuality\" >= 1 AND \"ExecutionQuality\" <= 5");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Trade_SetupQuality",
                table: "Trades",
                sql: "\"SetupQuality\" >= 1 AND \"SetupQuality\" <= 5");

            migrationBuilder.CreateIndex(
                name: "IX_EmotionChecks_PrimaryEmotion",
                table: "EmotionChecks",
                column: "PrimaryEmotion");

            migrationBuilder.AddCheckConstraint(
                name: "CK_EmotionCheck_Intensity",
                table: "EmotionChecks",
                sql: "\"Intensity\" >= 1 AND \"Intensity\" <= 5");

            migrationBuilder.AddCheckConstraint(
                name: "CK_EmotionCheck_PrimaryEmotion",
                table: "EmotionChecks",
                sql: "\"PrimaryEmotion\" IN ('fear', 'greed', 'confidence', 'anxiety', 'excitement', 'frustration', 'calm', 'fomo')");

            migrationBuilder.CreateIndex(
                name: "IX_UserInsights_IsActive",
                table: "UserInsights",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_UserInsights_UserId_InsightType",
                table: "UserInsights",
                columns: new[] { "UserId", "InsightType" });

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_Date",
                table: "UserSessions",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId_Date",
                table: "UserSessions",
                columns: new[] { "UserId", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserInsights");

            migrationBuilder.DropTable(
                name: "UserSessions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Trade_ExecutionQuality",
                table: "Trades");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Trade_SetupQuality",
                table: "Trades");

            migrationBuilder.DropIndex(
                name: "IX_EmotionChecks_PrimaryEmotion",
                table: "EmotionChecks");

            migrationBuilder.DropCheckConstraint(
                name: "CK_EmotionCheck_Intensity",
                table: "EmotionChecks");

            migrationBuilder.DropCheckConstraint(
                name: "CK_EmotionCheck_PrimaryEmotion",
                table: "EmotionChecks");

            migrationBuilder.DropColumn(
                name: "ExecutionQuality",
                table: "Trades");

            migrationBuilder.DropColumn(
                name: "SetupQuality",
                table: "Trades");

            migrationBuilder.DropColumn(
                name: "Intensity",
                table: "EmotionChecks");

            migrationBuilder.DropColumn(
                name: "MarketConditions",
                table: "EmotionChecks");

            migrationBuilder.DropColumn(
                name: "PrimaryEmotion",
                table: "EmotionChecks");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "EmotionChecks");
        }
    }
}
