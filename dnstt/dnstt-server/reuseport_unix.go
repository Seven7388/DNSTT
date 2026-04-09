//go:build !windows && !plan9 && !js

package main

import (
	"context"
	"net"
	"syscall"

	"golang.org/x/sys/unix"
)

func listenUDPReusePort(addr string) (net.PacketConn, error) {
	lc := net.ListenConfig{
		Control: func(network, address string, c syscall.RawConn) error {
			var opErr error
			err := c.Control(func(fd uintptr) {
				opErr = unix.SetsockoptInt(int(fd), unix.SOL_SOCKET, unix.SO_REUSEPORT, 1)
			})
			if err != nil {
				return err
			}
			return opErr
		},
	}
	return lc.ListenPacket(context.Background(), "udp", addr)
}
