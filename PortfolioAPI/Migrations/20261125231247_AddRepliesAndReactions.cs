using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortfolioAPI.Migrations;

/// <inheritdoc />
public partial class _20261125231247_AddRepliesAndReactions : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsHidden",
            table: "Comments",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<Guid>(
            name: "ParentCommentId",
            table: "Comments",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "CommentReactions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Emoji = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                VisitorId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CommentReactions", x => x.Id);
                table.ForeignKey(
                    name: "FK_CommentReactions_Comments_CommentId",
                    column: x => x.CommentId,
                    principalTable: "Comments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Comments_ParentCommentId",
            table: "Comments",
            column: "ParentCommentId");

        migrationBuilder.CreateIndex(
            name: "IX_CommentReactions_CommentId_VisitorId",
            table: "CommentReactions",
            columns: new[] { "CommentId", "VisitorId" },
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_Comments_Comments_ParentCommentId",
            table: "Comments",
            column: "ParentCommentId",
            principalTable: "Comments",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Comments_Comments_ParentCommentId",
            table: "Comments");

        migrationBuilder.DropTable(
            name: "CommentReactions");

        migrationBuilder.DropIndex(
            name: "IX_Comments_ParentCommentId",
            table: "Comments");

        migrationBuilder.DropColumn(
            name: "IsHidden",
            table: "Comments");

        migrationBuilder.DropColumn(
            name: "ParentCommentId",
            table: "Comments");
    }
}
