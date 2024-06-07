
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
  NavbarBrand,
} from "@nextui-org/react";
import { Book, HistoryIcon, HomeIcon, Languages, LayoutDashboard, ListTree, Menu, Palette } from "lucide-react";
import { signOut, } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { usePathname, Link as NextIntlLink } from "@/src/navigation";
import { Session } from "next-auth";

type NavbarProps = {
  session: Session | null;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
} & Record<"WordListIntl" | "SignInIntl" | "HomeIntl", string>;

export default function Navbar({
  session,
  WordListIntl,
  SignInIntl,
  HomeIntl,
  setIsSidebarOpen
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const params = useParams();
  const isAuthPage = ["/signup", "/signin", "/forgot-password"].includes(
    pathName
  );
  return (
    <NextuiNavbar
      className="bg-background-foreground/100 border-b border-border"
      shouldHideOnScroll
      maxWidth="full"
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
      <NavbarBrand className="gap-2">
        <Book aria-label="book icon" className="w-6 h-6 lg:w-8 lg:h-8" /> <h1 className="text-fs-0">Turkish Dictionary</h1>
      </NavbarBrand>
      <NavbarContent justify="end" className="gap-8 hidden lg:flex">
        <NavbarItem>
          <Dropdown classNames={{
            content: ["rounded-sm"],
          }}>
            <DropdownTrigger>
              <button className="bg-transparent flex items-center gap-2 rounded-sm">
                <Languages aria-label="languages icon" className="w-6 h-6" /> {locale.toUpperCase()}
              </button>
            </DropdownTrigger>
            <DropdownMenu>
              {locale === "en" ? (
                <DropdownItem color="primary" key={"tr"} className="rounded-sm">
                  <NextIntlLink
                    className="w-full block"
                    href={{
                      pathname: pathName,
                      query: searchParams.toString(),
                      params: {
                        token: params.token as any,
                      },
                    }}
                    locale="tr"
                  >
                    Türkçe
                  </NextIntlLink>
                </DropdownItem>
              ) : (
                <DropdownItem color="primary" key={"en"} className="rounded-sm">
                  <NextIntlLink
                    className="w-full block"
                    href={{
                      pathname: pathName,
                      query: searchParams.toString(),
                      params: {
                        token: params.token as any,
                      },
                    }}
                    locale="en"
                  >
                    English
                  </NextIntlLink>
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
        <NavbarItem>
          <Dropdown classNames={{
            content: ["rounded-sm"],
          }}>
            <DropdownTrigger className="cursor-pointer">
              <button className="bg-transparent flex items-center gap-2 rounded-sm">
                <Palette aria-label="palette icon" className="h-7 w-7" />
              </button>
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
              <DropdownItem className="rounded-sm" key={"dark-purple"}>Dark Purple</DropdownItem>
              <DropdownItem className="rounded-sm" key={"light-purple"}>Light Purple</DropdownItem>
              <DropdownItem className="rounded-sm" key={"dark"}>Dark</DropdownItem>
              <DropdownItem className="rounded-sm" key={"light"}>Light</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
        {!session?.user ? (
          <NavbarItem>

            <NextIntlLink
              className="w-full block"
              href={{
                pathname: '/signin',
                query: { callbackUrl: `${pathName}?${searchParams.toString()}` },
                search: pathName === "/signin" ? searchParams.toString() : undefined,
              }}
            ><Button
              aria-disabled={isAuthPage}
              isDisabled={isAuthPage}
              variant="ghost"
              color="primary"
              className="rounded-sm"

            >
                {SignInIntl}
              </Button>
            </NextIntlLink>


          </NavbarItem>
        ) : (
          <>
            <NavbarItem className="cursor-pointer">
              <Dropdown classNames={{
                content: ["rounded-sm"],
              }}>
                <DropdownTrigger>
                  <button className="rounded-sm">
                    <Avatar
                      showFallback
                      src={session.user.image ?? "https://images.unsplash.com/broken"}
                      size="sm"
                    />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  onAction={(key) => {
                    switch (key) {
                      case "sign-out":
                        signOut();
                        break;
                    }
                  }}
                >
                  <DropdownItem key={"saved-words"} className="text-center rounded-sm">
                    <Link as={NextIntlLink} className="w-full" href="/saved-words">
                      Saved Words
                    </Link>
                  </DropdownItem>
                  <DropdownItem key={"profile"} className="rounded-sm">
                    <Link as={NextIntlLink} className="w-full" href="/profile">
                      Profile
                    </Link>
                  </DropdownItem>
                  <DropdownItem
                    className="text-danger rounded-sm"
                    key={"sign-out"}
                    color="danger"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        )}

      </NavbarContent>
      <NavbarContent justify="end" className="lg:hidden">
        {!session?.user ? (
          <NavbarItem>

            <NextIntlLink
              className="w-full block"
              href={{
                pathname: '/signin',
                query: { callbackUrl: `${pathName}?${searchParams.toString()}` },
                search: pathName === "/signin" ? searchParams.toString() : undefined,
              }}
            ><Button
              aria-disabled={isAuthPage}
              isDisabled={isAuthPage}
              variant="ghost"
              color="primary"
              className="rounded-sm"

            >
                {SignInIntl}
              </Button>
            </NextIntlLink>


          </NavbarItem>
        ) : (
          <>
            <NavbarItem className="cursor-pointer">
              {/* <Dropdown classNames={{
                content: ["rounded-sm"],
              }}>
                <DropdownTrigger>
                  <button className="rounded-sm">
                    <Avatar
                      showFallback
                      src={session.user.image ?? "https://images.unsplash.com/broken"}
                      size="sm"
                    />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  onAction={(key) => {
                    switch (key) {
                      case "sign-out":
                        signOut();
                        break;
                    }
                  }}
                >
                  <DropdownItem key={"saved-words"} className="text-center rounded-sm">
                    <Link as={NextIntlLink} className="w-full" href="/saved-words">
                      Saved Words
                    </Link>
                  </DropdownItem>
                  <DropdownItem key={"profile"} className="rounded-sm">
                    <Link as={NextIntlLink} className="w-full" href="/profile">
                      Profile
                    </Link>
                  </DropdownItem>
                  <DropdownItem
                    className="text-danger rounded-sm"
                    key={"sign-out"}
                    color="danger"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown> */}
              <button>
                <Menu aria-label="menu icon" className="w-6 h-6 lg:w-8 lg:h-8" onClick={() => setIsSidebarOpen(true)} />
              </button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
      {/* <NavbarMenuToggle
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        className="lg:hidden"
      />
      <NavbarMenu className="bg-content1 lg:hidden">
        <NavbarMenuItem className="flex justify-between">
          <>
            <Dropdown className="" classNames={{
              content: ["rounded-sm"],
            }}>
              <DropdownTrigger>
                <button className="bg-transparent flex items-center gap-2 rounded-sm">
                  <Languages aria-label="languages icon" className="w-6 h-6" /> {locale.toUpperCase()}
                </button>
              </DropdownTrigger>
              <DropdownMenu>
                {locale === "en" ? (
                  <DropdownItem color="primary" key={"tr"} className="rounded-sm ">
                    <NextIntlLink
                      className="w-full block"
                      href={{
                        pathname: pathName,
                        query: searchParams.toString(),
                        params: {
                          token: params.token as any,
                        },
                      }}
                      locale="tr"
                    >
                      Türkçe
                    </NextIntlLink>
                  </DropdownItem>
                ) : (
                  <DropdownItem color="primary" key={"en"} className="rounded-sm w-full">
                    <NextIntlLink
                      className="w-full block"
                      href={{
                        pathname: pathName,
                        query: searchParams.toString(),
                        params: {
                          token: params.token as any,
                        },
                      }}
                      locale="en"
                    >
                      English
                    </NextIntlLink>
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
            <Dropdown classNames={{
              content: ["rounded-sm"],
            }}>
              <DropdownTrigger className="cursor-pointer">
                <button className="bg-transparent flex items-center gap-2 rounded-sm">
                  <Palette aria-label="palette icon" className="h-7 w-7" />
                </button>
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
                <DropdownItem className="rounded-sm" key={"dark-purple"}>Dark Purple</DropdownItem>
                <DropdownItem className="rounded-sm" key={"light-purple"}>Light Purple</DropdownItem>
                <DropdownItem className="rounded-sm" key={"dark"}>Dark</DropdownItem>
                <DropdownItem className="rounded-sm" key={"light"}>Light</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </>


        </NavbarMenuItem>
        <NavbarMenuItem>
          <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50' href={'/'}>
            <HomeIcon className="h-6 w-6" /> <span>{HomeIntl}</span>
          </NextIntlLink>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <NextIntlLink href={"/saved-words"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'>
            <ListTree /> {WordListIntl}
          </NextIntlLink>
        </NavbarMenuItem>

        <NavbarMenuItem>
          <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50' href={'/saved-words'}>
            <HistoryIcon className="h-6 w-6" /> <span>Search History</span>
          </NextIntlLink>
        </NavbarMenuItem>
        {
          session?.user ? (
            <NavbarMenuItem>
              <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'>
                <LayoutDashboard className='h-6 w-6' /> <span>Dashboard</span>
              </NextIntlLink>
            </NavbarMenuItem>
          ) : null
        }

      </NavbarMenu> */}
    </NextuiNavbar>
  );
}
