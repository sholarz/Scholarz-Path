import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { GraduationCap, Lock, ArrowLeft } from "lucide-react";
import { AxiosError } from "axios";
import { resetPassword as resetPasswordRequest } from "../../api/auth";
import { toast } from "sonner";

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
    error?: {
        code?: string;
        message?: string;
    };
}

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { token, email } = useMemo(() => {
        const searchParams = new URLSearchParams(window.location.search);

        return {
            token: searchParams.get("token") ?? "",
            email: searchParams.get("email") ?? "",
        };
    }, []);

    const getErrorMessage = (error: unknown): string => {
        if (!(error instanceof AxiosError)) {
            return "Failed to reset password";
        }

        const data = error.response?.data as ApiErrorResponse | undefined;
        const status = error.response?.status;
        const errorCode = data?.error?.code;
        const firstValidationError = data?.errors
            ? Object.values(data.errors)[0]?.[0]
            : undefined;

        if (status === 400 && errorCode === "INVALID_TOKEN") {
            return "This reset link is invalid or expired. Please request a new reset link.";
        }

        if (status === 429) {
            return "Too many attempts. Please wait a minute and try again.";
        }

        return (
            firstValidationError ||
            data?.error?.message ||
            data?.message ||
            "Failed to reset password"
        );
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (!token || !email) {
            toast.error("Invalid or incomplete reset link");
            return;
        }

        if (!password || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            await resetPasswordRequest({
                token,
                email,
                password,
                password_confirmation: confirmPassword,
            });

            toast.success("Password updated successfully. Please sign in.");
            navigate("/login");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 to-primary/10">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary rounded-lg p-3">
                            <GraduationCap className="w-8 h-8 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle>Set New Password</CardTitle>
                    <CardDescription>
                        Enter your new password for {email || "your account"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e: any) =>
                                        setPassword(e.target.value)
                                    }
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e: any) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !token || !email}
                        >
                            {isLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>

                    <Link to="/login">
                        <Button variant="ghost" className="w-full gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
