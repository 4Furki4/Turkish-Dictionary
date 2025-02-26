import {
  Navbar as NextuiNavbar,
  NavbarContent,
  NavbarItem,
  Button,
  Avatar,
  Link,
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
  NavbarBrand,
} from "@heroui/react";
import { Book, Languages, Menu, Moon, Palette, Sun } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { usePathname, Link as NextIntlLink } from "@/src/i18n/routing";
import { Session } from "next-auth";

type NavbarProps = {
  session: Session | null;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
} & Record<"WordListIntl" | "SignInIntl" | "HomeIntl", string>;

export default function Navbar({
  session,
  WordListIntl,
  SignInIntl,
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
      maxWidth="xl"
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
        // wrapper: ["sm:px-0"]
      }}
    >
      <NavbarContent justify="center">
        <NavbarItem>
          <NavbarBrand>
            <NextIntlLink as={Link as any} href="/" className="hidden sm:flex items-center gap-2">
              <Book className="h-6 w-6 text-primary" />
              <span className="text-fs-1 font-bold text-primary">Turkish Dictionary</span>
            </NextIntlLink>
            <button className="sm:hidden">
              <Menu aria-label="menu icon" className="h-7 w-7" onClick={() => setIsSidebarOpen(true)} />
            </button>
          </NavbarBrand>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end" className="gap-4 sm:gap-8">
        {session?.user.role === "admin" ? (
          <NavbarItem className="hidden sm:flex">
            <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm'>
              <span className={`text-nowrap`}>Dashboard</span>
            </NextIntlLink>
          </NavbarItem>
        ) : null}
        <NavbarItem className="hidden sm:flex">
          <NextIntlLink href={"/word-list"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm'>
            <span className={`text-nowrap`}>{WordListIntl}</span>
          </NextIntlLink>
        </NavbarItem>
        <NavbarItem>
          <Dropdown classNames={{
            content: ["rounded-sm"],
          }}>
            <DropdownTrigger>
              <button className="flex items-center gap-2 rounded-sm">
                <Languages aria-label="languages icon" className="w-6 h-6" /> {locale.toUpperCase()}
              </button>
            </DropdownTrigger>
            <DropdownMenu>
              {locale === "en" ? (
                <DropdownItem key={"tr"} className="rounded-sm">
                  <NextIntlLink
                    className="w-full block"
                    // @ts-ignore
                    href={{
                      pathname: pathName,
                      query: searchParams.toString(),
                      params: {
                        word: params.word as any,
                        id: params.id as any
                      },
                    }}
                    locale="tr"
                  >
                    Türkçe
                  </NextIntlLink>
                </DropdownItem>
              ) : (
                <DropdownItem key={"en"} className="rounded-sm">
                  <NextIntlLink
                    className="w-full block"
                    // @ts-ignore
                    href={{
                      pathname: pathName,
                      query: searchParams.toString(),
                      params: {
                        word: params.word as any,
                        id: params.id as any
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
          {/* theme button */}
          <Button aria-label="Switch theme" variant="light" isIconOnly onPress={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </NavbarItem>
        {!session?.user ? (
          <NavbarItem>
            {/* <NextIntlLink
              className="w-full block"
              // @ts-ignore
              href={{
                pathname: '/signin',
                query: { callbackUrl: decodeURI(`${getDynamicPathnames(pathName)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`) },
                search: pathName === "/signin" ? searchParams.toString() : undefined,
              }}
              >
              </NextIntlLink> */}
            <Button
              onPress={() => signIn()}
              aria-disabled={isAuthPage}
              isDisabled={isAuthPage}
              variant="shadow"
              color="primary"
              className="font-bold"
            >
              {SignInIntl}
            </Button>
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
                    <Link color="foreground" as={NextIntlLink} className="w-full" href="/saved-words">
                      Saved Words
                    </Link>
                  </DropdownItem>
                  <DropdownItem key={"search-history"} className="text-center rounded-sm">
                    <Link color="foreground" as={NextIntlLink} className="w-full" href="/search-history">
                      Search History
                    </Link>
                  </DropdownItem>
                  <DropdownItem key={"profile"} className="rounded-sm">
                    <Link color="foreground" as={NextIntlLink} className="w-full" href={`/profile/${session.user.id}`}>
                      Profile
                    </Link>
                  </DropdownItem>
                  <DropdownItem
                    className="rounded-sm text-destructive"
                    key={"sign-out"}
                    color="danger"
                    onPress={() => signOut()}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </NextuiNavbar>
  );
}