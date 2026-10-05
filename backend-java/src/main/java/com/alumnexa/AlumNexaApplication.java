package com.alumnexa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AlumNexaApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlumNexaApplication.class, args);
        System.out.println("=================================================");
        System.out.println("  AlumNexa Enterprise Java Backend Running");
        System.out.println("  Port: 8080 | Base Context: /api");
        System.out.println("=================================================");
    }
}
