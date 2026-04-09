//go:build windows || plan9 || js

package main

import (
	"net"
)

func listenUDPReusePort(addr string) (net.PacketConn, error) {
	// Fallback to standard listen on systems without SO_REUSEPORT
	return net.ListenPacket("udp", addr)
}
