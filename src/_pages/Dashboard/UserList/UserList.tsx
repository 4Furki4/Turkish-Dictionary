"use client"
import React, { useCallback } from 'react'
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    useDisclosure,
    Spinner,
    Button,
    User,
} from "@nextui-org/react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownSection,
    DropdownItem,
} from "@nextui-org/react";
import { Edit3, MoreVertical, Trash2 } from 'lucide-react';
import { api } from '@/src/trpc/react';
import { Pagination } from "@nextui-org/pagination";
import { Select, SelectItem } from "@nextui-org/select";
import { rolesEnum, SelectUser } from '@/db/schema/users';
import { Link } from '@/src/navigation';
import { Link as NextUILink } from '@nextui-org/react';
import RoleEditModal from './RoleEditModal';
const userPerPageOptions = [
    {
        label: "5",
        key: "5"
    },
    {
        label: "10",
        key: "10"
    },
    {
        label: "20",
        key: "20"
    },
    {
        label: "50",
        key: "50"
    }
]
const roles = rolesEnum.enumValues
export default function UserList(
    {
        users,
        userCount,
    }:
        {
            users: SelectUser[],
            userCount: number | undefined
        }
) {
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalChange } = useDisclosure();
    const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onOpenChange: onEditModalChange } = useDisclosure();
    const [selectedUser, setSelectedUser] = React.useState<{
        userId?: string | null;
        name?: string | null;
        role?: typeof roles[number];
    }>({ userId: "", name: "", role: undefined });
    const [pageNumber, setPageNumber] = React.useState<number>(1);
    const [usersPerPage, setUsersPerPage] = React.useState<number>(10);
    const usersCountQuery = api.user.getUserCount.useQuery(undefined, {
        initialData: userCount,
    });
    const totalPageNumber = usersCountQuery.data ? Math.ceil(usersCountQuery.data / usersPerPage) : undefined;
    const usersQuery = api.user.getUsers.useQuery({
        take: usersPerPage,
        skip: (pageNumber - 1) * usersPerPage
    }, {
        initialData: users,
    })
    type Row = (typeof rows)[0];
    const rows = usersQuery.data.map((user, idx) => {
        return {
            name: user.name,
            username: user.username,
            key: user.id,
            src: user.image,
            role: user.role
        };
    });
    const columns = [
        {
            key: "name",
            label: "Name",
        },
        {
            key: "role",
            label: "Role"
        },
        {
            key: "actions",
            label: "Actions",
        },
    ];
    const renderCell = useCallback((item: Row, columnKey: React.Key) => {
        const cellValue = item[columnKey as keyof Row];
        switch (columnKey) {
            case "actions":
                return (
                    <Dropdown>
                        <DropdownTrigger key={cellValue} className="flex justify-around items-center">
                            <button className="ml-auto">
                                <MoreVertical aria-description="more action button" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            onAction={(key) => {
                                if (key === "Delete") {
                                    setSelectedUser({
                                        userId: item.key,
                                        name: item.name,
                                        role: item.role
                                    });
                                    onDeleteModalOpen();
                                }
                                if (key === "Edit") {
                                    setSelectedUser({
                                        userId: item.key,
                                        name: item.name,
                                        role: item.role
                                    });
                                    onEditModalOpen();
                                }
                            }}
                        >
                            <DropdownSection title={"Actions"}>
                                <DropdownItem
                                    key={"Delete"}
                                    startContent={<Trash2 />}
                                    color={"danger"}
                                >
                                    Delete
                                </DropdownItem>
                                <DropdownItem key={'Edit'} startContent={<Edit3 />} color={"warning"}>
                                    Edit Role
                                </DropdownItem>
                            </DropdownSection>
                        </DropdownMenu>
                    </Dropdown>
                );
            case "name":
                return (
                    <User name={cellValue} description={
                        <NextUILink as='div'>
                            <Link href={'/profile'}> {/* TODO: will navigate to /users/[username] in the future */}
                                {item.username}
                            </Link>
                        </NextUILink>
                    } avatarProps={{
                        src: item.src ?? undefined
                    }} />
                );
            default:
                return cellValue;
        }
    }, []);
    return (
        <>
            <Table topContent={
                <div className="flex gap-4">
                    <Select label={"Words per page"} defaultSelectedKeys={["10"]}
                        size="sm"
                        classNames={{
                            base: "ml-auto max-w-64",
                        }} onChange={(e) => {
                            setUsersPerPage(parseInt(e.target.value));
                        }}>
                        {userPerPageOptions.map((pageCount) => (
                            <SelectItem key={pageCount.key}>
                                {pageCount.label}
                            </SelectItem>
                        ))}
                    </Select>
                </div>
            } bottomContent={
                <Pagination isDisabled={totalPageNumber === undefined} classNames={{
                    wrapper: ["mx-auto"]
                }} isCompact showControls total={totalPageNumber ?? 1} initialPage={1} onChange={async (page) => {
                    setPageNumber(page);
                }} />
            } classNames={{
                base: ["min-h-[300px]"],
            }} isStriped aria-label="Example table with dynamic content">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn align={column.key === "actions" ? "end" : "start"} key={column.key}>{column.label}</TableColumn>
                    )}
                </TableHeader>
                <TableBody items={rows}
                    loadingContent={<Spinner />}
                    loadingState={
                        usersQuery.isFetching ? "loading" : "idle"
                    }
                >
                    {(item) => (
                        <TableRow key={item.key + item.name}>
                            {(columnKey) => (
                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {isEditModalOpen ?
                <RoleEditModal key={selectedUser.userId} isOpen={isEditModalOpen} onOpenChange={onEditModalChange} userId={selectedUser.userId} selectedUserRole={selectedUser.role} skip={(pageNumber - 1) * usersPerPage} take={usersPerPage} /> : null
            }
        </>
    )
}
