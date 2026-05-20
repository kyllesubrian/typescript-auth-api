"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_json_1 = __importDefault(require("../../config.json"));
async function sendEmail(to, subject, html) {
    const transporter = nodemailer_1.default.createTransport(config_json_1.default.email);
    await transporter.sendMail({
        from: '"Auth API" <noreply@authapi.com>',
        to,
        subject,
        html
    });
}
