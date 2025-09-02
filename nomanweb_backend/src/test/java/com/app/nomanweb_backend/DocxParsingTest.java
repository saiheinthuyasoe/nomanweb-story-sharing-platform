package com.app.nomanweb_backend;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@SpringBootTest
public class DocxParsingTest {

    @Test
    public void testDocxParsing() {
        try {
            // Test with the existing test-docx.docx file
            String filePath = "c:\\Users\\saihe\\Downloads\\Nomanweb\\test-docx.docx";
            
            try (InputStream inputStream = new FileInputStream(filePath);
                 XWPFDocument document = new XWPFDocument(inputStream);
                 XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
                
                String extractedText = extractor.getText();
                System.out.println("Extracted text from DOCX:");
                System.out.println(extractedText);
                System.out.println("Text length: " + extractedText.length());
                
                // Check if text was extracted successfully
                if (extractedText == null || extractedText.trim().isEmpty()) {
                    System.err.println("ERROR: No text extracted from DOCX file!");
                } else {
                    System.out.println("SUCCESS: Text extracted successfully!");
                }
                
            }
        } catch (IOException e) {
            System.err.println("ERROR parsing DOCX file: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @Test
    public void testDocxParsingWithParagraphs() {
        try {
            String filePath = "c:\\Users\\saihe\\Downloads\\Nomanweb\\test-docx.docx";
            
            try (InputStream inputStream = new FileInputStream(filePath);
                 XWPFDocument document = new XWPFDocument(inputStream)) {
                
                System.out.println("Number of paragraphs: " + document.getParagraphs().size());
                
                // Extract text paragraph by paragraph
                StringBuilder textBuilder = new StringBuilder();
                document.getParagraphs().forEach(paragraph -> {
                    String paragraphText = paragraph.getText();
                    System.out.println("Paragraph: " + paragraphText);
                    textBuilder.append(paragraphText).append("\n");
                });
                
                String extractedText = textBuilder.toString();
                System.out.println("\nFull extracted text:");
                System.out.println(extractedText);
                System.out.println("Text length: " + extractedText.length());
                
            }
        } catch (Exception e) {
            System.err.println("ERROR in paragraph parsing: " + e.getMessage());
            e.printStackTrace();
        }
    }
}