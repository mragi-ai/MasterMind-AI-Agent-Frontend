import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Mail, LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserMenuProps {
  onLogout: () => void;
  userName?: string;
}

export function UserMenu({ onLogout, userName = "User" }: UserMenuProps) {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleContactUs = () => {
    setIsContactModalOpen(true);
  };

  const handleViewProfile = () => {
    navigate("/profile");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{userName}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer flex items-center"
          onClick={handleViewProfile}
        >
          <UserCircle className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex items-center"
          onClick={handleContactUs}
        >
          <Mail className="mr-2 h-4 w-4" />
          <span>Contact Us</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 flex items-center"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Contact Support</DialogTitle>
            <DialogDescription className="pt-4 text-base leading-relaxed text-center">
              You can reach our mentor desk directly at{" "}
              <a href="tel:+14073070855" className="font-medium text-primary hover:underline">
                +14073070855
              </a>{" "}
              or email us at{" "}
              <a href="mailto:training-support@mastermind.ai" className="font-medium text-primary hover:underline">
                training-support@mastermind.ai
              </a>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
