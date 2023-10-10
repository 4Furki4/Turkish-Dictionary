"use client";
import {
  Navbar as NextuiNavbar,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Avatar,
  Link,
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
} from "@nextui-org/react";
import { HomeIcon, Palette } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import NextLink from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useRouter, usePathname } from "next-intl/client";
import { onEnterAndSpace } from "@/lib/keyEvents";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export default function Navbar() {
  const { status, data } = useSession();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathName = usePathname();
  const params = useSearchParams();
  const route = useRouter();
  const locale = useLocale();
  const t = useTranslations("Navbar");
  return (
    <NextuiNavbar
      className="bg-content1"
      shouldHideOnScroll
      classNames={{
        item: [
          "relative",
          "flex",
          "h-full",
          "items-center",
          "data-[active=true]",
          "data-[active=true]:after:content-['']",
          "data-[active=true]:after:absolute",
          "data-[active=true]:after:bottom-0",
          "data-[active=true]:after:left-0",
          "data-[active=true]:after:right-0",
          "data-[active=true]:after:h-[2px]",
          "data-[active=true]:after:rounded-[2px]",
          "data-[active=true]:after:bg-primary",
        ],
        // wrapper: ["max-w-7xl"],
      }}
    >
      <NavbarMenuToggle
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        className="sm:hidden"
      />
      <NavbarContent className="hidden sm:flex" justify="start">
        <NavbarItem>
          <Link as={NextLink} href="/">
            <HomeIcon size={32} />
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent className="hidden sm:flex" justify="center">
        <NavbarItem isActive={pathName.includes("/word-list")}>
          <Link as={NextLink} href={"/word-list"}>
            {t("Word List")}
          </Link>
        </NavbarItem>
        <NavbarItem isActive={pathName.includes("/protected")}>
          <Link as={NextLink} href={"/protected"}>
            Protected Page
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="light" color="primary">
                {locale === "en" ? "English" : "Turkish"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => {
                const queryParams = decodeURIComponent(params.toString());
                switch (key) {
                  case "tr":
                    route.replace(`${pathName}?${queryParams}`, {
                      locale: "tr",
                    });
                    break;
                  case "en":
                    route.replace(`${pathName}?${queryParams}`, {
                      locale: "en",
                    });
                    break;
                }
              }}
            >
              {locale === "en" ? (
                <DropdownItem color="primary" key={"tr"}>
                  Turkish
                </DropdownItem>
              ) : (
                <DropdownItem color="primary" key={"en"}>
                  English
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
        <NavbarContent justify="center">
          {status !== "authenticated" ? (
            <NavbarItem>
              <Button
                onKeyDown={(e) =>
                  onEnterAndSpace(e, () => {
                    if (pathName !== "/signup") signIn();
                  })
                }
                onClick={() => {
                  if (pathName !== "/signup") signIn();
                }}
                variant="ghost"
                color="primary"
                isLoading={status === "loading"}
              >
                {t("Sign In")}
              </Button>
            </NavbarItem>
          ) : (
            <NavbarItem className="cursor-pointer">
              <Dropdown>
                <DropdownTrigger>
                  <button>
                    <Avatar
                      showFallback
                      src="https://images.unsplash.com/broken"
                      size="sm"
                    />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  onAction={(key) => {
                    switch (key) {
                      case "saved-words":
                        route.push("/saved-words");
                        break;
                      case "settings":
                        route.push("/settings");
                        break;
                      case "sign-out":
                        signOut();
                        break;
                    }
                  }}
                >
                  <DropdownItem key={"saved-words"} className="text-center">
                    <Link className="w-full" href="/saved-words">
                      Saved Words
                    </Link>
                  </DropdownItem>
                  <DropdownItem key={"settings"}>
                    <Link className="w-full" href="/settings">
                      Settings
                    </Link>
                  </DropdownItem>
                  <DropdownItem
                    className="text-danger"
                    key={"sign-out"}
                    color="danger"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          )}
        </NavbarContent>
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger className="cursor-pointer">
              <Button className="bg-transparent" variant="flat">
                <Palette size={32} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              color="primary"
              disabledKeys={[theme!]}
              onAction={(key) => {
                switch (key) {
                  case "dark-purple":
                    setTheme("dark-purple");
                    break;
                  case "light-purple":
                    setTheme("light-purple");
                    break;
                  case "dark":
                    setTheme("dark");
                    break;
                  case "light":
                    setTheme("light");
                    break;
                }
              }}
            >
              <DropdownItem key={"dark-purple"}>Dark Purple</DropdownItem>
              <DropdownItem key={"light-purple"}>Light Purple</DropdownItem>
              <DropdownItem key={"dark"}>Dark</DropdownItem>
              <DropdownItem key={"light"}>Light</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu className="bg-content1">
        <NavbarMenuItem>
          <Link
            as={NextLink}
            href={"/"}
            className={pathName === "/" ? "underline" : ""}
          >
            {t("Home")}
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            as={NextLink}
            href={"/word-list"}
            className={pathName.includes("word-list") ? "underline" : ""}
          >
            {t("Word List")}
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            as={NextLink}
            href={"/protected"}
            className={pathName.includes("protected") ? "underline" : ""}
          >
            Protected Page
          </Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </NextuiNavbar>
  );
}
