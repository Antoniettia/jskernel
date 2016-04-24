import * as util from './util';
import * as sys from './sys';
import * as defs from './definitions';
var debug = require('debug')('jskernel-posix:syscall');


// Files ---------------------------------------------------------------------------------------------------------------

export function read(fd: number, buf: Buffer): number {
    debug('read', fd);
    return sys.syscall(defs.syscalls.read, fd, buf, buf.length);
}

export function write(fd: number, buf: string|Buffer): number {
    debug('write', fd);
    if(!(buf instanceof Buffer)) buf = new Buffer((buf as string) + '\0');
    return sys.syscall(defs.syscalls.write, fd, buf, buf.length);
}

export function open (pathname: string, flags: defs.FLAG, mode?: defs.MODE): number {
    debug('write', pathname, flags, mode);
    var args = [defs.syscalls.open, pathname, flags];
    if(typeof mode === 'number') args.push(mode);
    return sys.syscall.apply(null, args);
}

export function close(fd: number): number {
    debug('close', fd);
    return sys.syscall(defs.syscalls.close, fd);
}


export function stat(filepath: string): defs.stat { // Throws number
    debug('stat', filepath);
    var buf = new Buffer(defs.stat.size);
    var result = sys.syscall(defs.syscalls.stat, filepath, buf);
    if(result == 0) return defs.stat.unpack(buf);
    throw result;
}

export function lstat(linkpath: string): defs.stat {
    debug('lstat', linkpath);
    var buf = new Buffer(defs.stat.size);
    var result = sys.syscall(defs.syscalls.lstat, linkpath, buf);
    if(result == 0) return defs.stat.unpack(buf);
    throw result;
}

export function fstat(fd: number): defs.stat {
    debug('fstat', fd);
    var buf = new Buffer(defs.stat.size);
    var result = sys.syscall(defs.syscalls.fstat, fd, buf);
    if(result == 0) return defs.stat.unpack(buf);
    throw result;
}


export function lseek(fd: number, offset: number, whence: number): number {
    debug('lseek', fd, offset, whence);
    return sys.syscall(defs.syscalls.lseek, fd, offset, whence);
}


// Memory --------------------------------------------------------------------------------------------------------------

// TODO: Could not make `mmap` work for some reason.
// void *mmap(void *addr, size_t lengthint " prot ", int " flags, int fd, off_t offset);
export function mmap(addr: number, length: number, prot: number, flags: number, fd: number, offset: number): number {
    debug('mmap', addr, length, prot, flags, fd, offset);
    return sys.syscall(defs.syscalls.mmap, length, prot, flags, fd, offset);
}

// int munmap(void *addr, size_t length);
export function munmap(addr: Buffer, length: number): number {
    debug('munmap');
    return sys.syscall(defs.syscalls.munmap, addr, length);
}


// Sockets -------------------------------------------------------------------------------------------------------------

// http://www.skyfree.org/linux/kernel_network/socket.html
// https://github.com/torvalds/linux/blob/master/net/socket.c
// http://www.wangafu.net/~nickm/libevent-book/01_intro.html
// https://banu.com/blog/2/how-to-use-epoll-a-complete-example-in-c/epoll-example.c
// int socket(int domain, int type, int protocol);
export function socket(domain: defs.AF, type: defs.SOCK, protocol: number): number {
    debug('socket', domain, type, protocol);
    return sys.syscall(defs.syscalls.socket, domain, type, protocol);
}

// connect(sockfd, (struct sockaddr *)&serv_addr, sizeof(serv_addr))
export function connect(fd: number, sockaddr: defs.sockaddr_in): number {
    debug('connect', fd, sockaddr.sin_addr.s_addr.toString(), sockaddr.sin_port);
    var buf = defs.sockaddr_in.pack(sockaddr);
    return sys.syscall(defs.syscalls.connect, fd, buf, buf.length);
}

export function bind(fd: number, sockaddr: defs.sockaddr_in): number {
    debug('bind', fd, sockaddr.sin_addr.s_addr.toString(), sockaddr.sin_port);
    var buf = defs.sockaddr_in.pack(sockaddr);
    return sys.syscall(defs.syscalls.bind, fd, buf, buf.length);
}

// int listen(int sockfd, int backlog);
export function listen(fd: number, backlog: number): number {
    debug('listen', fd, backlog);
    return sys.syscall(defs.syscalls.listen, fd, backlog);
}

// int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
export function accept(fd: number, buf: Buffer): number {
    debug('accept', fd);
    var buflen = defs.int32.pack(buf.length);
    return sys.syscall(defs.syscalls.accept, fd, buf, buflen);
}

// int accept4(int sockfd, struct sockaddr *addr, socklen_t *addrlen, int flags);
export function accept4(fd: number, buf: Buffer, flags: defs.SOCK) {
    debug('accept4', fd, flags);
    var buflen = defs.int32.pack(buf.length);
    return sys.syscall(defs.syscalls.accept4, fd, buf, buflen, flags);
}

export function shutdown(fd: number, how: defs.SHUT) {
    debug('shutdown', fd, how);
    return sys.syscall(defs.syscalls.shutdown, fd, how);
}

// TODO: does not work yet...
// ssize_t sendto(int sockfd, const void *buf, size_t len, int flags, const struct sockaddr *dest_addr, socklen_t addrlen);
export function sendto(fd: number, buf: Buffer, flags: defs.MSG = 0, addr?: defs.sockaddr): number {
    debug('sendto', fd);
    var params = [defs.syscalls.sendto, fd, buf, buf.length, flags];
    if(addr) {
        var addrbuf = defs.sockaddr.pack(addr);
        params.push(addrbuf);
        params.push(addrbuf.length);
    }
    return sys.syscall.apply(null, params);
}

// ssize_t send(int sockfd, const void *buf, size_t len, int flags);
export function send(fd: number, buf: Buffer, flags: defs.MSG = 0): number {
    debug('send', fd);
    return sendto(fd, buf, flags);
}


// Process -------------------------------------------------------------------------------------------------------------

export function getpid() {
    debug('getpid');
    return sys.syscall(defs.syscalls.getpid);
}

export function getppid() {
    debug('getppid');
    return sys.syscall(defs.syscalls.getppid);
}

export function getuid() {
    debug('getuid');
    return sys.syscall(defs.syscalls.getuid);
}

export function geteuid() {
    debug('geteuid');
    return sys.syscall(defs.syscalls.geteuid);
}

export function getgid() {
    debug('getgid');
    return sys.syscall(defs.syscalls.getgid);
}

export function getegid() {
    debug('getegid');
    return sys.syscall(defs.syscalls.getegid);
}


// Events --------------------------------------------------------------------------------------------------------------

export function fcntl(fd: number, cmd: number, arg?: number): number {
    debug('fcntl', fd, cmd, arg);
    var params = [defs.syscalls, fd, cmd];
    if(typeof arg !== 'undefined') params.push(arg);
    return sys.syscall.apply(null, params);
}

// getaddrinfo
// freeaddrinfo
// http://davmac.org/davpage/linux/async-io.html#epoll
// int epoll_create(int size);
// Size is ignored, but most be greater than 0.
export function epoll_create(size: number): number {
    debug('epoll_create', size);
    return sys.syscall(defs.syscalls.epoll_create, size);
}

// int epoll_create1(int flags);
export function epoll_create1(flags: defs.EPOLL): number {
    debug('epoll_create1');
    return sys.syscall(defs.syscalls.epoll_create1, flags);
}

// typedef union epoll_data {
//     void    *ptr;
//     int      fd;
//     uint32_t u32;
//     uint64_t u64;
// } epoll_data_t;
//
// struct epoll_event {
//     uint32_t     events;    /* Epoll events */
//     epoll_data_t data;      /* User data variable */
// };
// http://man7.org/linux/man-pages/man2/epoll_wait.2.html
// int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
export function epoll_wait(epfd: number, buf: Buffer, maxevents: number, timeout: number): number {
    debug('epoll_wait', epfd, maxevents, timeout);
    return sys.syscall(defs.syscalls.epoll_wait, epfd, buf, maxevents, timeout);
}

// int epoll_pwait(int epfd, struct epoll_event *events, int maxevents, int timeout, const sigset_t *sigmask);
// export function epoll_pwait() {
//
// }

// int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
export function epoll_ctl(epfd: number, op: defs.EPOLL_CTL, fd: number, epoll_event: defs.epoll_event): number {
    var buf = defs.epoll_event.pack(epoll_event);
    return sys.syscall(defs.syscalls.epoll_ctl, epfd, op, fd, buf);
}