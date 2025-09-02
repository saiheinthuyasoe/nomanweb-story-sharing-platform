package com.app.nomanweb_backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
@EnableScheduling
@Slf4j
public class AsyncConfig {

    @Bean(name = "chapterModerationExecutor")
    public Executor chapterModerationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Configure thread pool for chapter moderation
        executor.setCorePoolSize(5);  // Minimum threads
        executor.setMaxPoolSize(20);  // Maximum threads for high load
        executor.setQueueCapacity(100); // Queue size before creating new threads
        executor.setThreadNamePrefix("ChapterModeration-");
        
        // Configure rejection policy
        executor.setRejectedExecutionHandler((runnable, threadPoolExecutor) -> {
            log.warn("Chapter moderation task rejected. Queue full. Active: {}, Pool: {}, Queue: {}",
                    threadPoolExecutor.getActiveCount(),
                    threadPoolExecutor.getPoolSize(),
                    threadPoolExecutor.getQueue().size());
            
            // Try to run in caller thread as fallback
            if (!threadPoolExecutor.isShutdown()) {
                runnable.run();
            }
        });
        
        // Configure shutdown
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        
        log.info("Initialized chapter moderation thread pool with core={}, max={}, queue={}",
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());
        
        return executor;
    }
    
    @Bean(name = "generalAsyncExecutor")
    public Executor generalAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Configure general async thread pool
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("GeneralAsync-");
        
        executor.setRejectedExecutionHandler((runnable, threadPoolExecutor) -> {
            log.warn("General async task rejected. Queue full.");
            // Run in caller thread as fallback
            if (!threadPoolExecutor.isShutdown()) {
                runnable.run();
            }
        });
        
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        
        executor.initialize();
        return executor;
    }
}