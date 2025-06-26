#!/usr/bin/env python3
"""
Quest Fix CLI - Command-line interface for Quest Dev Copilot

Usage:
    python quest_fix.py path/to/logfile.log
    python quest_fix.py path/to/logfile.log --apply-fix
    python quest_fix.py path/to/logfile.log --backend-url http://localhost:5000
"""

import click
import requests
import json
import os
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from typing import Dict, Optional

console = Console()

@click.command()
@click.argument('log_file', type=click.Path(exists=True))
@click.option('--backend-url', default='http://localhost:5000', 
              help='Backend API URL (default: http://localhost:5000)')
@click.option('--apply-fix', is_flag=True, 
              help='Automatically apply fix if available')
@click.option('--output', '-o', type=click.Path(), 
              help='Save analysis results to JSON file')
@click.option('--verbose', '-v', is_flag=True, 
              help='Enable verbose output')
def quest_fix(log_file: str, backend_url: str, apply_fix: bool, 
              output: Optional[str], verbose: bool):
    """
    Analyze Unreal Engine Quest build errors and get AI-powered fixes.
    
    This tool sends your log file to the Quest Dev Copilot backend,
    analyzes the errors using AI, and provides step-by-step fixes.
    """
    
    # Display header
    console.print(Panel.fit(
        "[bold blue]Quest Dev Copilot CLI[/bold blue]\n"
        "[dim]AI-powered debugging for Quest VR development[/dim]",
        border_style="blue"
    ))
    
    console.print(f"📁 Analyzing: [cyan]{log_file}[/cyan]")
    console.print(f"🌐 Backend: [yellow]{backend_url}[/yellow]\n")
    
    try:
        # Read log file
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            log_content = f.read()
        
        if verbose:
            console.print(f"📊 Log file size: {len(log_content)} characters")
        
        # Send to backend with progress indicator
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Analyzing error with AI...", total=None)
            
            response = requests.post(
                f"{backend_url}/analyze",
                json={
                    "log_content": log_content,
                    "use_cache": False
                },
                timeout=60  # 60 second timeout
            )
        
        if response.status_code != 200:
            console.print(f"[red]❌ Error: {response.text}[/red]")
            return
        
        result = response.json()
        
        # Display results
        display_analysis_results(result, verbose)
        
        # Save output if requested
        if output:
            save_results(result, output)
            console.print(f"💾 Results saved to: [green]{output}[/green]")
        
        # Apply auto-fix if requested
        if apply_fix and result.get('auto_fix'):
            apply_automatic_fix(result['auto_fix'], log_file)
        
    except FileNotFoundError:
        console.print(f"[red]❌ Log file not found: {log_file}[/red]")
    except requests.RequestException as e:
        console.print(f"[red]❌ Network error: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")
        if verbose:
            import traceback
            console.print(traceback.format_exc())

def display_analysis_results(result: Dict, verbose: bool):
    """Display the analysis results in a formatted way"""
    
    classification = result.get('classification', {})
    
    # Classification table
    table = Table(title="🔍 Error Classification", show_header=False)
    table.add_column("Property", style="cyan", width=15)
    table.add_column("Value", style="green")
    
    table.add_row("Error Type", classification.get('error_type', 'unknown'))
    table.add_row("Confidence", f"{classification.get('confidence', 0)*100:.1f}%")
    table.add_row("Auto-fixable", "✅ Yes" if classification.get('auto_fixable') else "❌ No")
    
    # Show enhanced analysis indicator
    if result.get('enhanced_analysis'):
        table.add_row("AI Enhancement", "✅ Training Data")
    
    console.print(table)
    console.print()
    
    # Fix instructions
    fix_text = result.get('fix', 'No fix instructions available')
    console.print(Panel(
        fix_text,
        title="🔧 [bold]Fix Instructions[/bold]",
        border_style="green",
        expand=False
    ))
    
    # Auto-fix information
    auto_fix = result.get('auto_fix')
    if auto_fix:
        console.print(Panel(
            f"Action: {auto_fix.get('action', 'unknown')}\n"
            f"Target: {auto_fix.get('plugin_name', 'unknown')}\n"
            f"File: {auto_fix.get('file_path', 'unknown')}",
            title="🤖 [bold]Auto-Fix Available[/bold]",
            border_style="yellow",
            expand=False
        ))
    
    # Sources
    sources = result.get('sources', [])
    if sources:
        console.print("\n📚 [bold]Sources:[/bold]")
        for i, source in enumerate(sources, 1):
            relevance = source.get('relevance_score', 0)
            console.print(f"  {i}. [link]{source.get('url', 'Unknown')}[/link] (relevance: {relevance:.2f})")
    
    # Metrics (if verbose)
    if verbose and 'metrics' in result:
        metrics = result['metrics']
        console.print(f"\n📊 [bold]Metrics:[/bold]")
        console.print(f"  • Tokens used: {metrics.get('tokens_used', 'N/A')}")
        console.print(f"  • Cost: ${metrics.get('estimated_cost', 0):.4f}")
        console.print(f"  • Latency: {metrics.get('latency_ms', 'N/A')}ms")
        
        # Show training data usage
        training_examples = metrics.get('training_examples_used', 0)
        if training_examples > 0:
            console.print(f"  • Training examples used: {training_examples}")

def save_results(result: Dict, output_path: str):
    """Save analysis results to JSON file"""
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

def apply_automatic_fix(auto_fix: Dict, log_file_path: str):
    """Apply automatic fixes to project files"""
    console.print("\n🔧 [yellow]Applying automatic fix...[/yellow]")
    
    action = auto_fix.get('action')
    
    if action == 'toggle_plugin':
        apply_plugin_toggle(auto_fix)
    elif action == 'update_config':
        apply_config_update(auto_fix)
    else:
        console.print(f"[yellow]⚠️  Unknown auto-fix action: {action}[/yellow]")

def apply_plugin_toggle(auto_fix: Dict):
    """Apply plugin toggle to .uproject file"""
    plugin_name = auto_fix.get('plugin_name')
    enabled = auto_fix.get('enabled')
    
    # Find .uproject files in current directory
    uproject_files = list(Path('.').glob('*.uproject'))
    
    if not uproject_files:
        console.print("[red]❌ No .uproject file found in current directory[/red]")
        return
    
    uproject_path = uproject_files[0]
    
    try:
        with open(uproject_path, 'r') as f:
            project_data = json.load(f)
        
        # Find or create plugins section
        if 'Plugins' not in project_data:
            project_data['Plugins'] = []
        
        # Find the plugin
        plugin_found = False
        for plugin in project_data['Plugins']:
            if plugin.get('Name') == plugin_name:
                plugin['Enabled'] = enabled
                plugin_found = True
                break
        
        # Add if not found
        if not plugin_found:
            project_data['Plugins'].append({
                'Name': plugin_name,
                'Enabled': enabled
            })
        
        # Write back
        with open(uproject_path, 'w') as f:
            json.dump(project_data, f, indent=2)
        
        status = "enabled" if enabled else "disabled"
        console.print(f"✅ [green]Plugin '{plugin_name}' {status} in {uproject_path}[/green]")
        console.print("💡 [yellow]Remember to regenerate project files![/yellow]")
        
    except Exception as e:
        console.print(f"[red]❌ Failed to modify {uproject_path}: {e}[/red]")

def apply_config_update(auto_fix: Dict):
    """Apply configuration file updates"""
    file_path = auto_fix.get('file_path', '')
    section = auto_fix.get('section', '')
    key = auto_fix.get('key', '')
    value = auto_fix.get('value', '')
    
    console.print(f"📝 [yellow]Config update needed:[/yellow]")
    console.print(f"  File: {file_path}")
    console.print(f"  Section: {section}")
    console.print(f"  {key} = {value}")
    console.print("⚠️  [yellow]Please apply this manually or use the Unreal plugin for auto-apply[/yellow]")

if __name__ == '__main__':
    quest_fix()